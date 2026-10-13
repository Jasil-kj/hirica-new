from typing import List, Dict, Any, Optional
from api.core.config import settings
from api.ai.agents.recruitment_agents import (
    JobCompetencyAgent,
    ResumeEvidenceAgent,
    AssessmentGenAgent,
    InterviewInvestigatorAgent,
    IntegrityAgent,
    CandidateRankingAgent,
    DecisionAgent,
    FairnessAuditorAgent
)
from api.ai.assessment.evaluator import SemanticAnswerEvaluator

class MultiAgentHiringSystem:
    """Orchestrator for the Autonomous Multi-Agent Hiring Pipeline"""
    def __init__(self):
        self.groq_key = settings.GROQ_API_KEY
        self.job_agent = JobCompetencyAgent(self.groq_key)
        self.resume_agent = ResumeEvidenceAgent(self.groq_key)
        self.assessment_agent = AssessmentGenAgent()
        self.interview_agent = InterviewInvestigatorAgent(self.groq_key)
        self.integrity_agent = IntegrityAgent()
        self.ranking_agent = CandidateRankingAgent()
        self.decision_agent = DecisionAgent()
        self.answer_evaluator = SemanticAnswerEvaluator()
        self.fairness_auditor = FairnessAuditorAgent(self.groq_key)

    def evaluate_assessment_answers(self, questions: List[Dict[str, Any]], answers: Dict[str, Any]) -> Dict[str, Any]:
        return self.answer_evaluator.evaluate_answers(questions, answers)

    def evaluate_application(
        self, 
        job_title: str, 
        requirements: List[str], 
        candidate_name: str, 
        candidate_cv: str, 
        test_score: Optional[float] = None, 
        questions_count: int = 5,
        suspicious_events: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        job_res = self.job_agent.process(job_title, "", requirements)
        resume_res = self.resume_agent.process(job_title, job_res["competencies"], candidate_cv)
        assess_res = self.assessment_agent.process(job_res["competencies"], questions_count)
        interview_res = self.interview_agent.process(job_title, resume_res["gaps"])
        integrity_res = self.integrity_agent.process(suspicious_events)

        t_score = test_score if test_score is not None else resume_res["evidence_score"]
        ranking_res = self.ranking_agent.process(resume_res["evidence_score"], t_score, integrity_res["trust_score"])
        decision_res = self.decision_agent.process(job_title, candidate_name, resume_res, ranking_res, integrity_res)

        fairness_res = self.fairness_auditor.audit(
            job_title=job_title,
            requirements=job_res["competencies"],
            candidate_cv=candidate_cv,
            resume_res=resume_res,
            test_score=test_score,
            integrity_res=integrity_res,
            decision_res=decision_res
        )

        return {
            "pipeline_summary": decision_res,
            "fairness_audit": fairness_res,
            "agents": {
                "job_agent": job_res,
                "resume_agent": resume_res,
                "assessment_agent": assess_res,
                "interview_agent": interview_res,
                "integrity_agent": integrity_res,
                "ranking_agent": ranking_res,
                "decision_agent": decision_res,
                "fairness_auditor": fairness_res
            }
        }
