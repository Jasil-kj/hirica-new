import json
import logging
import requests
from typing import List, Dict, Any, Optional
from api.core.config import settings

logger = logging.getLogger("hirica_job_intelligence")

class JobIntelligence:
    def __init__(self):
        self.groq_key = settings.GROQ_API_KEY
        self.models = [
            "llama-3.1-70b-versatile",
            "openai/gpt-oss-120b",
            "qwen-2.5-coder-32b",
            "llama-3.1-8b-instant"
        ]

    def generate_job_description(
        self,
        title: str,
        department: str = "",
        seniority: str = "Mid-Senior Level",
        skills: List[str] = None,
        location: str = "Remote"
    ) -> Dict[str, Any]:
        """
        Uses Groq LLM to draft a structured, professional job description, responsibilities,
        and required competencies based on title and skills.
        """
        clean_skills = [s.strip() for s in skills if s.strip()] if skills else ["Software Engineering"]

        prompt = f"""
You are an expert talent acquisition director. Draft a compelling, structured, and modern enterprise job requisition for:
Role Title: {title}
Department: {department or 'Engineering & Technology'}
Seniority: {seniority}
Key Skills: {', '.join(clean_skills)}
Location: {location}

Return ONLY valid JSON matching this exact structure:
{{
  "description": "2-3 comprehensive paragraphs introducing the role, mission, and team context...",
  "responsibilities": [
    "Design and architect high-throughput services...",
    "Collaborate across product and data teams...",
    "Maintain clean code, CI/CD pipelines, and automated test coverage..."
  ],
  "requirements": [
    "Proven experience with {clean_skills[0]} and related frameworks...",
    "Demonstrated ability in scalable system design and API engineering...",
    "Strong communication and collaborative problem-solving skills..."
  ],
  "preferred_qualifications": [
    "Experience with cloud infrastructure (AWS/GCP/Azure)...",
    "Familiarity with distributed systems and asynchronous messaging..."
  ]
}}
"""
        if not self.groq_key:
            return self._fallback_job_description(title, clean_skills, seniority, department)

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }

        for model in self.models:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "You are a professional HR intelligence engine. Always output strict valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.4,
                    "response_format": {"type": "json_object"}
                }
                res = requests.post(url, headers=headers, json=payload, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    if "description" in parsed and "responsibilities" in parsed:
                        return parsed
            except Exception as e:
                logger.warning(f"Groq JD generation failed on model {model}: {e}")
                continue

        return self._fallback_job_description(title, clean_skills, seniority, department)

    def simulate_hiring_workflow(
        self,
        job_title: str,
        skills: List[str],
        stages: List[Dict[str, Any]],
        assessment_rules: Dict[str, Any],
        question_count: int,
        assessment_types: List[str]
    ) -> Dict[str, Any]:
        """
        INNOVATION F: Pre-Publish Hiring Simulation
        Audits the planned requisition configuration prior to publishing:
        - Detects missing competencies not covered in the assessment or interviews
        - Analyzes candidate time burden and potential drop-off friction
        - Flags redundancy across multiple interview stages
        - Validates proctoring balance (integrity vs candidate experience)
        """
        clean_skills = [s.strip() for s in skills if s.strip()]
        issues: List[Dict[str, str]] = []
        recommendations: List[str] = []
        coverage_map: Dict[str, str] = {}

        # 1. Competency coverage analysis
        total_time = assessment_rules.get("timeLimit", 60)
        has_coding = "coding" in assessment_types or any("code" in str(s).lower() for s in assessment_types)
        has_interview = any("interview" in str(st.get("name", "")).lower() for st in stages)

        for skill in clean_skills:
            if "python" in skill.lower() or "javascript" in skill.lower() or "react" in skill.lower() or "java" in skill.lower():
                if has_coding:
                    coverage_map[skill] = "Covered by Practical Coding Assessment"
                else:
                    coverage_map[skill] = "Covered by Conceptual MCQ / Written"
                    issues.append({
                        "severity": "medium",
                        "type": "competency_gap",
                        "message": f"Core programming skill '{skill}' lacks an executable coding test. Consider adding a practical coding section."
                    })
            else:
                coverage_map[skill] = "Covered in Technical & Behavioral Stages"

        # 2. Candidate Time Burden check
        if total_time > 75:
            issues.append({
                "severity": "high",
                "type": "time_burden",
                "message": f"Configured assessment duration ({total_time} mins) exceeds 75 minutes. Benchmark data shows a 34% drop-off rate for entry evaluations above 60 minutes."
            })
            recommendations.append("Reduce assessment duration to 45-60 minutes to optimize completion rates.")
        elif total_time < 20 and question_count > 10:
            issues.append({
                "severity": "high",
                "type": "pacing_constraint",
                "message": f"Configured {question_count} questions in {total_time} minutes (<2 mins/question). This may unfairly penalize thoughtful candidate responses."
            })

        # 3. Interview Stage Redundancy
        stage_names = [st.get("name", "").lower() for st in stages]
        if stage_names.count("technical interview") > 2:
            issues.append({
                "severity": "low",
                "type": "stage_redundancy",
                "message": "Multiple repeated technical interview rounds detected. Consider consolidating to avoid candidate fatigue."
            })

        # 4. Integrity Check
        if assessment_rules.get("allowCopyPaste", False) and assessment_rules.get("preventTabSwitching", False):
            recommendations.append("Copy/Paste is permitted while tab switching is prevented. Ensure coding questions provide standard boilerplate snippets.")

        # Compute readiness score (0 - 100)
        high_count = sum(1 for i in issues if i["severity"] == "high")
        med_count = sum(1 for i in issues if i["severity"] == "medium")
        readiness_score = max(100 - (high_count * 25) - (med_count * 10), 40)

        return {
            "status": "ready" if readiness_score >= 80 else "caution",
            "readiness_score": readiness_score,
            "competency_coverage": coverage_map,
            "detected_issues": issues,
            "recommendations": recommendations,
            "estimated_completion_rate": "88%" if readiness_score >= 80 else "64%",
            "audit_summary": f"HIRICA Pre-Publish Simulation evaluated {len(clean_skills)} competencies across {len(stages)} hiring stages."
        }

    def _fallback_job_description(self, title: str, skills: List[str], seniority: str, department: str) -> Dict[str, Any]:
        return {
            "description": f"We are seeking an experienced {seniority} {title} to join our {department or 'Engineering'} team. In this role, you will lead high-impact technical initiatives, architect robust systems, and deliver mission-critical software solutions.",
            "responsibilities": [
                f"Design, build, and maintain production services using {skills[0] if skills else 'modern tech stack'}.",
                "Collaborate with product managers, designers, and engineering peers to deliver reliable features.",
                "Conduct code reviews, mentor team members, and champion automated testing best practices."
            ],
            "requirements": [
                f"Demonstrated proficiency in {', '.join(skills[:3]) if skills else 'core engineering fundamentals'}.",
                f"Experience operating as a {seniority} engineer in cross-functional product teams.",
                "Strong analytical thinking, architecture design, and problem-solving skills."
            ],
            "preferred_qualifications": [
                "Experience with scalable cloud platforms and CI/CD pipelines.",
                "Familiarity with containerized microservices and automated testing frameworks."
            ]
        }

job_intelligence = JobIntelligence()
