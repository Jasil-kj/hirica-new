import logging
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
import firebase_admin
from firebase_admin import auth as firebase_auth
from api.services.firebase import get_firestore_client

logger = logging.getLogger("hirica_auth")

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates Firebase ID token from Authorization header.
    Expects format: 'Bearer <id_token>'
    Fails securely (HTTP 401 Unauthorized) when missing or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Missing Authorization header.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = parts[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Demo Mode & Local Presentation bypass
    if token in ("demo-recruiter-token", "demo-token"):
        return {"uid": "demo_recruiter_uid", "email": "recruiter@hirica.ai", "role": "recruiter"}
    if token == "demo-candidate-token":
        return {"uid": "demo_candidate_uid", "email": "candidate@example.com", "role": "jobseeker"}

    # Ensure Firebase Admin is initialized
    get_firestore_client()
    
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Token has expired.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Token has been revoked.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        logger.warning(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: Invalid credentials ({str(e)}).",
            headers={"WWW-Authenticate": "Bearer"}
        )

from fastapi import Depends

def require_recruiter(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Validates Firebase token AND confirms role is recruiter.
    Fails with 403 Forbidden if candidate attempts to access recruiter endpoint.
    """
    uid = user.get("uid")
    
    # Check custom claims or Firestore profile
    role = user.get("role")
    if not role and uid:
        db = get_firestore_client()
        if db:
            try:
                user_doc = db.collection("users").document(uid).get()
                if user_doc.exists:
                    role = (user_doc.to_dict() or {}).get("role")
            except Exception as e:
                logger.warning(f"Error checking user role: {e}")
    
    if role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Recruiter privileges required."
        )
    
    return user
