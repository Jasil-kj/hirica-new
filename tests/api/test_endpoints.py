import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_health_check_public():
    """Verify health endpoint is accessible without authentication"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root_endpoint_public():
    """Verify root endpoint is public"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_resume_evaluation_public():
    """Verify ATS resume evaluation can be executed for candidate preview"""
    payload = {
        "job_title": "Python Developer",
        "requirements": ["Python", "FastAPI"],
        "candidate_cv": "Experienced Python developer with 4 years in FastAPI and PostgreSQL."
    }
    response = client.post("/api/evaluate-resume", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "evaluation" in data
    assert data["evaluation"]["match_score"] > 0

def test_parse_cv_file_text_plain():
    """Verify text CV file extraction"""
    cv_content = b"Candidate Name: Alice Smith\nSkills: React, TypeScript, Node.js"
    files = {"file": ("resume.txt", cv_content, "text/plain")}
    response = client.post("/api/parse-cv-file", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Alice Smith" in data["extracted_text"]

def test_multi_agent_eval_rejects_missing_auth():
    """Verify 401 Unauthorized when calling /api/multi-agent-eval without token"""
    payload = {
        "job_title": "Backend Engineer",
        "requirements": ["Python"],
        "candidate_name": "Test Candidate",
        "candidate_cv": "Python Dev",
        "test_score": 85.0
    }
    response = client.post("/api/multi-agent-eval", json=payload)
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_multi_agent_eval_rejects_invalid_token():
    """Verify 401 Unauthorized when invalid token is provided"""
    headers = {"Authorization": "Bearer invalid_fake_token_12345"}
    payload = {
        "job_title": "Backend Engineer",
        "requirements": ["Python"],
        "candidate_name": "Test Candidate",
        "candidate_cv": "Python Dev",
        "test_score": 85.0
    }
    response = client.post("/api/multi-agent-eval", json=payload, headers=headers)
    assert response.status_code == 401
    assert "Authentication failed" in response.json()["detail"]

def test_ai_interview_turn_rejects_missing_auth():
    """Verify 401 Unauthorized for AI interview without authentication"""
    payload = {
        "job_title": "ML Engineer",
        "requirements": ["PyTorch"],
        "candidate_name": "Test Candidate",
        "candidate_cv": "Deep learning researcher",
        "candidate_response": "I have worked on Transformers."
    }
    response = client.post("/api/ai-interview/turn", json=payload)
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_generate_job_description_requires_recruiter_auth():
    """Verify 401 Unauthorized when calling recruiter JD generator without auth"""
    payload = {
        "title": "Staff AI Architect",
        "skills": ["LLMs", "Python"]
    }
    response = client.post("/api/generate-job-description", json=payload)
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_simulate_hiring_workflow_requires_recruiter_auth():
    """Verify 401 Unauthorized when calling recruiter simulation without auth"""
    payload = {
        "job_title": "Staff AI Architect",
        "skills": ["LLMs"],
        "stages": [{"name": "ATS", "order": 1}],
        "assessment_rules": {"preventTabSwitching": True}
    }
    response = client.post("/api/simulate-hiring-workflow", json=payload)
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_record_integrity_event_rejects_unauthenticated():
    """Verify 401 Unauthorized when recording integrity events without token"""
    payload = {
        "eventType": "TAB_SWITCH",
        "timestamp": "2026-10-13T04:30:00Z",
        "sessionId": "session_test_xyz"
    }
    response = client.post("/api/integrity/events", json=payload)
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]

def test_get_integrity_events_rejects_unauthenticated():
    """Verify 401 Unauthorized when retrieving integrity events without recruiter auth"""
    response = client.get("/api/integrity/events/session_test_xyz")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]
