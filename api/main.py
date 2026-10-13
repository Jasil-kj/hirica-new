import logging
import uuid
from datetime import datetime
from typing import Optional, Any, Dict
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.core.config import settings
from api.schemas.recruitment import (
    HealthResponse,
    ResumeEvalRequest,
    JobRequirements,
    AssessmentResponse,
    EvaluateAnswersRequest,
    MultiAgentRequest,
    InterviewSessionRequest,
    JobDescriptionRequest,
    PrePublishSimulationRequest
)
from api.ai.resume.parser import extract_text_from_cv
from api.ai.resume.ats import evaluate_resume_ats
from api.ai.assessment.generator import AssessmentGenerator
from api.ai.orchestration.pipeline import MultiAgentHiringSystem
from api.ai.interview.interviewer import execute_interview_turn
from api.ai.job_intelligence import job_intelligence
from api.services.firebase import get_firestore_client

from api.core.auth import get_current_user, require_recruiter
from fastapi import Depends

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hirica_api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Multi-Agent AI Recruitment, Assessment, and Integrity Intelligence Platform"
)

# Hardened CORS Policy: Restricted strictly to configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Initialize Firebase client
try:
    get_firestore_client()
except Exception as e:
    logger.warning(f"Firebase initialization notice: {e}")

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": str(datetime.now())
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "timestamp": str(datetime.now())
    }

@app.post("/api/parse-cv-file")
async def parse_cv_file(file: UploadFile = File(...)):
    try:
        content_bytes = await file.read()
        extracted_text = extract_text_from_cv(content_bytes, file.filename or "")
        return {
            "status": "success",
            "filename": file.filename,
            "extracted_text": extracted_text,
            "char_count": len(extracted_text),
            "word_count": len(extracted_text.split())
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing CV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse CV: {str(e)}")

@app.post("/api/evaluate-resume")
async def evaluate_resume(request: ResumeEvalRequest):
    try:
        eval_result = evaluate_resume_ats(
            job_title=request.job_title,
            requirements=request.requirements or [],
            candidate_cv=request.candidate_cv or ""
        )
        return {
            "status": "success",
            "evaluation": eval_result
        }
    except Exception as e:
        logger.error(f"Error evaluating resume: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-assessment", response_model=AssessmentResponse)
async def generate_assessment(requirements: JobRequirements):
    try:
        gen = AssessmentGenerator()
        num_q = requirements.num_questions or 5
        data = gen.generate_assessment(
            job_title=requirements.job_title,
            skills=requirements.skills,
            responsibilities=requirements.responsibilities,
            num_questions=num_q
        )
        time_limit = requirements.time_limit or data.get("total_time", 60)
        assessment = {
            "id": str(uuid.uuid4()),
            "title": f"Assessment for {requirements.job_title}",
            "description": f"Testing competencies in {', '.join(requirements.skills)}",
            "questions": data["questions"],
            "timeLimit": time_limit,
            "rules": data["rules"]
        }
        return AssessmentResponse(
            assessment=assessment,
            status="success",
            message="Assessment generated successfully"
        )
    except Exception as e:
        logger.error(f"Error generating assessment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate-answers")
async def evaluate_answers(request: EvaluateAnswersRequest):
    try:
        orchestrator = MultiAgentHiringSystem()
        result = orchestrator.evaluate_assessment_answers(request.questions, request.answers)
        return {
            "status": "success",
            "evaluation": result
        }
    except Exception as e:
        logger.error(f"Error evaluating answers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/multi-agent-eval")
async def multi_agent_eval(
    request: MultiAgentRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        orchestrator = MultiAgentHiringSystem()
        result = orchestrator.evaluate_application(
            job_title=request.job_title,
            requirements=request.requirements,
            candidate_name=request.candidate_name,
            candidate_cv=request.candidate_cv,
            test_score=request.test_score,
            questions_count=request.questions_count or 5,
            suspicious_events=request.suspicious_events
        )
        return {
            "status": "success",
            "agent_pipeline": result,
            "evaluated_by_user": current_user.get("uid")
        }
    except Exception as e:
        logger.error(f"Error in multi-agent pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai-interview/turn")
async def ai_interview_turn(
    request: InterviewSessionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    try:
        result = execute_interview_turn(
            job_title=request.job_title,
            requirements=request.requirements,
            candidate_name=request.candidate_name,
            candidate_cv=request.candidate_cv,
            identified_gaps=request.identified_gaps or [],
            conversation_history=request.conversation_history or [],
            candidate_response=request.candidate_response
        )
        return result
    except Exception as e:
        logger.error(f"Error in AI interview: {e}", exc_info=True)
        return {
            "status": "fallback",
            "interviewer_text": f"Thank you. Could you elaborate on how you approach scalability and testing in {request.job_title}?",
            "rating": 75,
            "feedback": "Standard technical follow-up.",
            "is_complete": False
        }

@app.post("/api/generate-job-description")
async def generate_job_description(
    request: JobDescriptionRequest,
    recruiter_user: Dict[str, Any] = Depends(require_recruiter)
):
    try:
        result = job_intelligence.generate_job_description(
            title=request.title,
            department=request.department or "",
            seniority=request.seniority or "Mid-Senior Level",
            skills=request.skills or [],
            location=request.location or "Remote"
        )
        return {
            "status": "success",
            "job_description": result
        }
    except Exception as e:
        logger.error(f"Error generating job description: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate-hiring-workflow")
async def simulate_hiring_workflow(
    request: PrePublishSimulationRequest,
    recruiter_user: Dict[str, Any] = Depends(require_recruiter)
):
    try:
        simulation = job_intelligence.simulate_hiring_workflow(
            job_title=request.job_title,
            skills=request.skills,
            stages=request.stages,
            assessment_rules=request.assessment_rules,
            question_count=request.question_count or 5,
            assessment_types=request.assessment_types or []
        )
        return {
            "status": "success",
            "simulation": simulation
        }
    except Exception as e:
        logger.error(f"Error in hiring workflow simulation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Integrity Event Schema ───────────────────────────────────────────────────
class IntegrityEventPayload(BaseModel):
    eventType: str
    timestamp: str
    sessionId: str          # assessmentId or interviewId used as session key
    candidateId: Optional[str] = None
    source: str = "browser" # 'camera' | 'browser'
    durationMs: Optional[float] = None
    details: Optional[Dict[str, Any]] = None

@app.post("/api/integrity/events")
async def record_integrity_event(
    payload: IntegrityEventPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Persists a single integrity event to the assessments/interviews collection in Firestore.
    Falls back to structured in-memory acknowledgement if Firebase is not configured.
    """
    try:
        db = get_firestore_client()
        event_record = {
            "eventType":  payload.eventType,
            "timestamp":  payload.timestamp,
            "source":     payload.source,
            "sessionId":  payload.sessionId,
            "candidateId": payload.candidateId,
            "durationMs": payload.durationMs,
            "details":    payload.details or {},
            "recordedAt": datetime.utcnow().isoformat()
        }

        if db is not None:
            # Append to integrityEvents array in the assessment/application doc
            doc_ref = db.collection("assessments").document(payload.sessionId)
            from google.cloud.firestore_v1 import ArrayUnion, Increment
            doc_ref.set({
                "integrityEvents": ArrayUnion([event_record]),
                "integrityEventCount": Increment(1)
            }, merge=True)
            logger.info(f"Integrity event persisted to Firestore: {payload.eventType} session={payload.sessionId}")
            return {"status": "persisted", "event": event_record}
        else:
            # Firebase not configured — acknowledge without failing the assessment
            logger.warning(f"Integrity event acknowledged (Firebase not configured): {payload.eventType}")
            return {"status": "acknowledged_no_db", "event": event_record}
    except Exception as e:
        logger.error(f"Error persisting integrity event: {e}", exc_info=True)
        # Never crash the assessment — return 200 even on DB error
        return {"status": "error_acknowledged", "error": str(e)}

@app.get("/api/integrity/events/{session_id}")
async def get_integrity_events(
    session_id: str,
    recruiter_user: Dict[str, Any] = Depends(require_recruiter)
):
    """
    Retrieves all integrity events for a given session (assessment or interview).
    Used by Candidate Dossier to display the integrity timeline.
    """
    try:
        db = get_firestore_client()
        if db is None:
            return {"status": "no_db", "events": []}
        doc_ref = db.collection("assessments").document(session_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict() or {}
            return {
                "status": "success",
                "session_id": session_id,
                "events": data.get("integrityEvents", []),
                "event_count": data.get("integrityEventCount", 0)
            }
        return {"status": "not_found", "events": []}
    except Exception as e:
        logger.error(f"Error retrieving integrity events: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
