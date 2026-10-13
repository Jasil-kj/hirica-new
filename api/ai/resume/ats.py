import json
import requests
from typing import List, Dict, Any, Optional
from api.core.config import settings

def evaluate_resume_ats(
    job_title: str,
    requirements: List[str],
    candidate_cv: str
) -> Dict[str, Any]:
    """Semantic ATS Resume Evaluator with negative checks and Groq LLM integration"""
    clean_reqs = [r.strip() for r in requirements if r.strip()] if requirements else [job_title]

    # Negative Case 1: Empty or whitespace CV
    if not candidate_cv or not candidate_cv.strip() or len(candidate_cv.strip()) < 10:
        return {
            "match_score": 0,
            "ats_score": 0,
            "summary": "Candidate resume is empty or contains insufficient text.",
            "matched_skills": [],
            "missing_skills": clean_reqs,
            "recommendation": "Reject - No Resume Provided",
            "strengths": [],
            "gaps": ["Empty or invalid resume submitted"]
        }

    # Negative Case 2: Gibberish detection
    cv_text = candidate_cv.strip()
    common_words = {"the", "and", "in", "to", "of", "a", "with", "for", "experience", "skills", "developer", "engineer", "work", "project", "responsible", "management", "team", "years", "education", "university", "system", "software"}
    words = set(cv_text.lower().split())
    if len(words) < 5 or len(words.intersection(common_words)) < 2:
        return {
            "match_score": 5,
            "ats_score": 5,
            "summary": "Resume content appears to be unintelligible or lacks coherent career experience.",
            "matched_skills": [],
            "missing_skills": clean_reqs,
            "recommendation": "Reject - Unintelligible Resume Text",
            "strengths": [],
            "gaps": ["Unintelligible / random text detected"]
        }

    groq_key = settings.GROQ_API_KEY
    if groq_key:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json"
        }
        prompt = f"""
Perform a semantic ATS evaluation of candidate's CV against requirements for '{job_title}'.
Job Requirements: {json.dumps(clean_reqs)}
Candidate CV:
{candidate_cv}

Rules:
- Semantic matching: skills like 'PyTorch' or 'CNNs' match 'Machine Learning'.
- Return ONLY valid JSON:
{{
  "match_score": 85,
  "ats_score": 85,
  "summary": "Detailed summary...",
  "matched_skills": ["List matched"],
  "missing_skills": ["List missing"],
  "recommendation": "Recommended for Assessment",
  "strengths": ["Strong skills..."],
  "gaps": ["Identified gaps..."]
}}
"""
        models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "qwen-2.5-coder-32b"]
        for m in models:
            try:
                res = requests.post(url, headers=headers, json={
                    "model": m,
                    "messages": [
                        {"role": "system", "content": "You are a Senior Technical Recruiter & ATS Engine."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"}
                }, timeout=10)
                if res.status_code == 200:
                    data = json.loads(res.json()["choices"][0]["message"]["content"])
                    return data
            except Exception:
                pass

    # Deterministic fallback calculation
    cv_lower = cv_text.lower()
    matched = [r for r in clean_reqs if r.lower() in cv_lower]
    missing = [r for r in clean_reqs if r.lower() not in cv_lower]
    score = round((len(matched) / max(1, len(clean_reqs))) * 100)

    return {
        "match_score": score,
        "ats_score": score,
        "summary": f"Candidate demonstrates {len(matched)} of {len(clean_reqs)} core competencies.",
        "matched_skills": matched,
        "missing_skills": missing,
        "recommendation": "Recommended for Assessment" if score >= 60 else "Under Review",
        "strengths": ["Matched role competencies directly in CV"] if matched else [],
        "gaps": missing
    }
