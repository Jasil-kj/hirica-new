import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "healthy"
    system: str = "HIRICA Multi-Agent AI Recruiting API"
    timestamp: str

class ResumeEvalRequest(BaseModel):
    job_title: str
    requirements: Optional[List[str]] = Field(default_factory=list)
    candidate_cv: Optional[str] = ""

class ResumeEvalResponse(BaseModel):
    match_score: int
    ats_score: int
    summary: str
    matched_skills: List[str]
    missing_skills: List[str]
    recommendation: str
    strengths: List[str]
    gaps: List[str]

class JobRequirements(BaseModel):
    job_title: str
    skills: List[str]
    responsibilities: List[str]
    time_limit: Optional[int] = 60
    num_questions: Optional[int] = 5

class AssessmentResponse(BaseModel):
    assessment: Dict[str, Any]
    status: str
    message: str

class EvaluateAnswersRequest(BaseModel):
    questions: List[Dict[str, Any]]
    answers: Dict[str, Any]

class MultiAgentRequest(BaseModel):
    job_title: str
    requirements: List[str]
    candidate_name: str
    candidate_cv: str
    test_score: Optional[float] = None
    questions_count: Optional[int] = 5
    suspicious_events: Optional[List[Dict[str, Any]]] = None

class InterviewSessionRequest(BaseModel):
    job_title: str
    requirements: List[str]
    candidate_name: str
    candidate_cv: str
    identified_gaps: Optional[List[str]] = Field(default_factory=list)
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    candidate_response: Optional[str] = None

class JobDescriptionRequest(BaseModel):
    title: str
    department: Optional[str] = "Engineering & Technology"
    seniority: Optional[str] = "Mid-Senior Level"
    skills: Optional[List[str]] = Field(default_factory=list)
    location: Optional[str] = "Remote"

class PrePublishSimulationRequest(BaseModel):
    job_title: str
    skills: List[str]
    stages: List[Dict[str, Any]]
    assessment_rules: Dict[str, Any]
    question_count: Optional[int] = 5
    assessment_types: Optional[List[str]] = Field(default_factory=list)
