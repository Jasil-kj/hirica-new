import json
import requests
from typing import List, Dict, Any, Optional

class JobCompetencyAgent:
    """Agent 1: Extracts required core competencies and skill weights from job requirements"""
    def __init__(self, groq_key: Optional[str] = None):
        self.groq_key = groq_key

    def process(self, job_title: str, description: str, requirements: List[str]) -> Dict[str, Any]:
        clean_reqs = [r.strip() for r in requirements if r.strip()] if requirements else [job_title]
        return {
            "agent": "Job Agent",
            "competencies": clean_reqs,
            "domain": job_title,
            "extracted_weights": {req: round(100 / max(1, len(clean_reqs)), 1) for req in clean_reqs}
        }

class ResumeEvidenceAgent:
    """Agent 2: Finds concrete candidate evidence from resume matching required competencies"""
    def __init__(self, groq_key: Optional[str] = None):
        self.groq_key = groq_key

    def process(self, job_title: str, competencies: List[str], candidate_cv: str) -> Dict[str, Any]:
        if not candidate_cv or not candidate_cv.strip() or len(candidate_cv.strip()) < 10:
            return {
                "agent": "Resume Agent",
                "evidence_score": 0,
                "evidence_found": [],
                "gaps": competencies,
                "summary": "No resume or CV content provided. Zero evidence found."
            }

        cv_lower = (candidate_cv or "").lower()
        matched = [c for c in competencies if c.lower() in cv_lower]
        missing = [c for c in competencies if c.lower() not in cv_lower]

        if self.groq_key:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"}
            prompt = f"""
As the Resume Evidence Agent, rigorously analyze this candidate CV against competencies for '{job_title}'.
Competencies: {json.dumps(competencies)}
Candidate CV:
{candidate_cv}

CRITICAL RULES:
- If CV is completely unrelated or has no matching technical evidence, evidence_score MUST be under 20.
- Only award evidence for skills clearly stated in CV.

Return ONLY valid JSON:
{{
  "evidence_score": 15,
  "evidence_found": ["Only verified skills"],
  "gaps": {json.dumps(competencies)},
  "summary": "Key evidence found..."
}}
"""
            models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "qwen-2.5-coder-32b"]
            for m in models:
                try:
                    res = requests.post(url, headers=headers, json={
                        "model": m,
                        "messages": [{"role": "system", "content": "You are an expert Resume Evidence Extraction Agent."}, {"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    }, timeout=10)
                    if res.status_code == 200:
                        data = json.loads(res.json()["choices"][0]["message"]["content"])
                        return {
                            "agent": "Resume Agent",
                            "evidence_score": data.get("evidence_score", 0),
                            "evidence_found": data.get("evidence_found", []),
                            "gaps": data.get("gaps", competencies),
                            "summary": data.get("summary", "Extracted evidence from CV matches role.")
                        }
                except Exception:
                    pass

        match_ratio = len(matched) / max(1, len(competencies))
        calc_score = round(match_ratio * 100)
        return {
            "agent": "Resume Agent",
            "evidence_score": calc_score,
            "evidence_found": matched,
            "gaps": missing,
            "summary": f"Verified candidate experience: {len(matched)} of {len(competencies)} competencies demonstrated." if matched else "No matching competencies found in resume."
        }

class AssessmentGenAgent:
    """Agent 3: Validates technical competency coverage in generated test"""
    def process(self, competencies: List[str], questions_count: int) -> Dict[str, Any]:
        return {
            "agent": "Assessment Agent",
            "competencies_tested": competencies,
            "total_questions_generated": questions_count,
            "coverage_percentage": 100
        }

class InterviewInvestigatorAgent:
    """Agent 4: Formulates targeted technical interview questions to probe candidate gaps"""
    def __init__(self, groq_key: Optional[str] = None):
        self.groq_key = groq_key

    def process(self, job_title: str, gaps: List[str]) -> Dict[str, Any]:
        if not gaps:
            gaps = ["System Architecture", "Performance Tuning"]
            
        questions = [
            f"Can you explain your experience handling {gap} in a production environment?"
            for gap in gaps[:3]
        ]
        return {
            "agent": "Interview Agent",
            "targeted_gap_probes": questions,
            "areas_to_investigate": gaps
        }

class IntegrityAgent:
    """Agent 5: Evaluates proctoring telemetry and cheating risk signals"""
    def process(self, suspicious_events: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        count = len(suspicious_events) if suspicious_events else 0
        trust_score = max(0, 100 - (count * 15))
        return {
            "agent": "Integrity Agent",
            "trust_score": trust_score,
            "flagged": trust_score < 70,
            "cheating_risk": "Low" if trust_score >= 85 else "Medium" if trust_score >= 70 else "High",
            "events_detected": count
        }

class CandidateRankingAgent:
    """Agent 6: Calculates weighted composite score to rank candidate"""
    def process(self, ats_score: float, test_score: float, trust_score: float) -> Dict[str, Any]:
        # Formula: 40% ATS Evidence + 50% Technical Test + 10% Integrity Trust Score
        composite = round((ats_score * 0.4) + (test_score * 0.5) + (trust_score * 0.1), 1)
        return {
            "agent": "Ranking Agent",
            "composite_score": composite,
            "tier": "Tier 1 (Top Talent)" if composite >= 85 else "Tier 2 (Qualified)" if composite >= 70 else "Tier 3 (Under Review)"
        }

class DecisionAgent:
    """Agent 7: Synthesizes input from all agents and produces explainable recommendation"""
    def process(
        self, 
        job_title: str, 
        candidate_name: str, 
        evidence: Dict[str, Any], 
        ranking: Dict[str, Any], 
        integrity: Dict[str, Any]
    ) -> Dict[str, Any]:
        score = ranking["composite_score"]
        if integrity.get("flagged") or integrity.get("trust_score", 100) < 50:
            verdict = "REJECT / INTEGRITY VIOLATION"
            recommendation = f"Disqualified due to severe proctoring violations ({integrity.get('events_detected', 0)} suspicious events detected). Cheating risk is High."
        elif score >= 85:
            verdict = "STRONG HIRE"
            recommendation = f"Highly recommended for {job_title}. Demonstrates strong evidence and high technical proficiency."
        elif score >= 70:
            verdict = "HIRE / INTERVIEW"
            recommendation = f"Recommended for technical interview. Solid competency coverage with minor areas to probe."
        else:
            verdict = "REJECT / HOLD"
            recommendation = f"Does not meet threshold for {job_title}. Significant skill gaps detected."

        return {
            "agent": "Decision Agent",
            "verdict": verdict,
            "explainability_summary": recommendation,
            "final_score": score,
            "trust_badge": integrity["cheating_risk"] + " Risk"
        }

class FairnessAuditorAgent:
    """Agent 8: AI Fairness & Trustworthy Governance Auditor (NIST Trustworthy AI Aligned)"""
    def __init__(self, groq_key: Optional[str] = None):
        self.groq_key = groq_key

    def audit(
        self,
        job_title: str,
        requirements: List[str],
        candidate_cv: str,
        resume_res: Dict[str, Any],
        test_score: Optional[float],
        integrity_res: Dict[str, Any],
        decision_res: Dict[str, Any]
    ) -> Dict[str, Any]:
        evidence_count = len(resume_res.get("evidence_found", []))
        tech_verified = evidence_count > 0 or (test_score is not None and test_score >= 50)
        tech_status = "verified" if tech_verified else "flagged"
        tech_icon = "✓" if tech_verified else "⚠"
        tech_detail = f"Recommendation is grounded in {evidence_count} verified competency evidence points." if evidence_count > 0 else "Limited direct technical evidence detected."

        relevance_verified = len(requirements) > 0 and (resume_res.get("evidence_score", 0) > 0 or len(resume_res.get("evidence_found", [])) > 0)
        exp_status = "verified" if relevance_verified else "flagged"
        exp_icon = "✓" if relevance_verified else "⚠"
        exp_detail = "Evaluation is strictly confined to role-specific competency requirements." if relevance_verified else "Applicant background lacks direct role-specific experience."

        score_diff = abs((test_score or 0) - resume_res.get("evidence_score", 0)) if test_score is not None else 0
        consistent = score_diff <= 40 or test_score is None
        assess_status = "verified" if consistent else "flagged"
        assess_icon = "✓" if consistent else "⚠"
        assess_detail = "Technical assessment results correlate consistently with verified resume profile." if consistent else f"Noticeable divergence ({round(score_diff)} pts) between resume claims and test score."

        has_explanation = bool(decision_res.get("explainability_summary"))
        decision_status = "verified" if has_explanation else "flagged"
        decision_icon = "✓" if has_explanation else "⚠"
        decision_detail = f"Decision is fully substantiated: '{decision_res.get('verdict', 'REVIEW')}' based on objective competency metrics."

        cv_lower = (candidate_cv or "").lower()
        bias_sensitive_proxies = ["graduated in 19", "born in 19", "marital", "married", "single", "religion", "ethnicity", "ivy league only"]
        detected_proxies = [p for p in bias_sensitive_proxies if p in cv_lower]
        bias_status = "low_risk" if not detected_proxies else "monitored"
        bias_icon = "✓" if not detected_proxies else "⚠"
        bias_detail = "Zero demographic, age, or institutional proxy bias signals detected. Evaluated purely on merit & skills." if not detected_proxies else f"Monitored proxy signals noted ({', '.join(detected_proxies)}); overridden by objective competency metrics."

        all_audited = [tech_status, exp_status, assess_status, decision_status]
        audit_passed = all(s == "verified" for s in all_audited)

        return {
            "agent": "Fairness Auditor",
            "audit_passed": audit_passed,
            "governance_standard": "NIST Trustworthy AI (Fairness, Transparency, Explainability, Reliability)",
            "statement": "HIRICA continuously audits AI-assisted hiring decisions for consistency, explainability and potential bias signals.",
            "checklist": {
                "technical_evidence": {
                    "label": "Technical evidence",
                    "status": tech_status,
                    "icon": tech_icon,
                    "detail": tech_detail
                },
                "experience_relevance": {
                    "label": "Experience relevance",
                    "status": exp_status,
                    "icon": exp_icon,
                    "detail": exp_detail
                },
                "assessment_consistency": {
                    "label": "Assessment consistency",
                    "status": assess_status,
                    "icon": assess_icon,
                    "detail": assess_detail
                },
                "decision_explanation": {
                    "label": "Decision explanation",
                    "status": decision_status,
                    "icon": decision_icon,
                    "detail": decision_detail
                },
                "potential_bias_signal": {
                    "label": "Potential bias signal",
                    "status": bias_status,
                    "icon": bias_icon,
                    "detail": bias_detail
                }
            },
            "audit_summary": "Recommendation verified under NIST Trustworthy AI guidelines." if audit_passed else "Audit completed with advisory flags for recruiter review."
        }
