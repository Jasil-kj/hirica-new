import os
import firebase_admin
from firebase_admin import credentials, firestore
from api.core.config import settings

db = None

def get_firestore_client():
    global db
    if db is not None:
        return db
    
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if os.path.exists(cred_path):
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        return db
    return None
