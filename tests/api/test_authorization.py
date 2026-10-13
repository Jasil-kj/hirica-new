import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.core.auth import get_current_user, require_recruiter

client = TestClient(app)

def test_mock_authenticated_candidate_multi_agent_pipeline():
    """Verify that a valid authenticated candidate can execute the 8-agent pipeline"""
    def mock_candidate_user():
        return {"uid": "candidate_123", "email": "candidate@example.com", "role": "jobseeker"}

    app.dependency_overrides[get_current_user] = mock_candidate_user
    try:
        payload = {
            "job_title": "Python Backend Engineer",
            "requirements": ["Python", "FastAPI", "PostgreSQL"],
            "candidate_name": "Alice Candidate",
            "candidate_cv": "Experienced in Python and FastAPI backend development.",
            "test_score": 85.0,
            "questions_count": 5,
            "suspicious_events": []
        }
        response = client.post("/api/multi-agent-eval", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["evaluated_by_user"] == "candidate_123"
        assert "agent_pipeline" in data
        assert "fairness_audit" in data["agent_pipeline"]
    finally:
        app.dependency_overrides.clear()

def test_mock_candidate_blocked_from_recruiter_endpoints():
    """Verify that a candidate user receives 403 Forbidden on recruiter-only endpoints"""
    def mock_candidate_user():
        return {"uid": "candidate_123", "email": "candidate@example.com", "role": "jobseeker"}

    # Mock get_current_user to return candidate, require_recruiter should reject
    app.dependency_overrides[get_current_user] = mock_candidate_user
    try:
        payload = {
            "title": "Senior AI Architect",
            "skills": ["LLMs"]
        }
        response = client.post("/api/generate-job-description", json=payload)
        assert response.status_code == 403
        assert "Recruiter privileges required" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

def test_mock_recruiter_allowed_recruiter_endpoints():
    """Verify that a verified recruiter user can generate job descriptions"""
    def mock_recruiter_user():
        return {"uid": "recruiter_456", "email": "recruiter@hirica.ai", "role": "recruiter"}

    app.dependency_overrides[require_recruiter] = mock_recruiter_user
    try:
        payload = {
            "title": "DevOps Engineer",
            "department": "Platform",
            "seniority": "Senior",
            "skills": ["Docker", "Kubernetes", "Terraform"],
            "location": "Remote"
        }
        response = client.post("/api/generate-job-description", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "job_description" in data
        assert "description" in data["job_description"]
    finally:
        app.dependency_overrides.clear()
