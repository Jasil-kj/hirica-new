import json
import random
import requests
from typing import List, Dict, Any, Optional
from api.core.config import settings

class AssessmentGenerator:
    def __init__(self):
        self.groq_key = settings.GROQ_API_KEY
        self.difficulties = ["beginner", "intermediate", "advanced"]

    def _generate_questions_with_groq(
        self,
        job_title: str,
        skills: List[str],
        responsibilities: List[str] = None,
        num_questions: int = 5
    ) -> List[Dict[str, Any]]:
        if not self.groq_key:
            return []

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_key}",
            "Content-Type": "application/json"
        }
        clean_skills = [s.strip() for s in skills if s.strip()] if skills else [job_title]

        prompt = f"""
Generate {num_questions} high-quality assessment questions for '{job_title}'.
Skills: {', '.join(clean_skills)}
Responsibilities: {', '.join(responsibilities) if responsibilities else 'Standard duties'}

Include a mix of:
1. Multiple Choice (type: 'multiple-choice', with 4 clear options and correct answer)
2. Practical Coding (type: 'coding', options: null)
3. Written Technical Conceptual (type: 'written', options: null)

Return ONLY valid JSON matching this schema:
{{
  "questions": [
    {{
      "id": "1",
      "question": "Question text...",
      "type": "multiple-choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct...",
      "difficulty": "intermediate",
      "time_limit": 5
    }}
  ]
}}
"""
        models_to_try = [
            "llama-3.1-70b-versatile",
            "openai/gpt-oss-120b",
            "qwen-2.5-coder-32b",
            "llama-3.1-8b-instant"
        ]

        for model_name in models_to_try:
            try:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "You are an expert technical interviewer creating assessment tests. Always return valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.4,
                    "response_format": {"type": "json_object"}
                }
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                if response.status_code == 200:
                    data = response.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(data)
                    questions = parsed.get("questions", [])
                    if questions:
                        return questions
            except Exception:
                pass
        return []

    def _generate_fallback_questions(self, job_title: str, skills: List[str], target_count: int = 5) -> List[Dict[str, Any]]:
        clean_skills = [s.strip() for s in skills if s.strip()] if skills else [job_title]
        questions = []
        cycle_idx = 0

        while len(questions) < target_count:
            skill = clean_skills[cycle_idx % len(clean_skills)]
            diff = self.difficulties[cycle_idx % len(self.difficulties)]
            cycle_idx += 1

            questions.append({
                "id": str(random.randint(1000, 9999)),
                "question": f"What is a core best practice when developing with {skill} in a production environment?",
                "type": "multiple-choice",
                "options": [
                    f"Prioritize modular architecture and automated tests for {skill}",
                    f"Avoid documentation to increase deployment speed in {skill}",
                    f"Hardcode secrets directly into source files for {skill}",
                    f"Disable runtime logging in {skill} to reduce file size"
                ],
                "correctAnswer": f"Prioritize modular architecture and automated tests for {skill}",
                "explanation": f"Automated testing and modularity ensure high software reliability and prevent regressions in {skill}.",
                "difficulty": diff,
                "time_limit": 5
            })

        return questions

    def generate_assessment(
        self,
        job_title: str,
        skills: List[str],
        responsibilities: List[str] = None,
        num_questions: int = 5
    ) -> Dict[str, Any]:
        questions = self._generate_questions_with_groq(job_title, skills, responsibilities, num_questions)
        if len(questions) < num_questions:
            fallback_qs = self._generate_fallback_questions(job_title, skills, target_count=num_questions)
            questions.extend(fallback_qs)

        selected_questions = questions[:num_questions]
        total_time = sum(q.get("time_limit", 5) for q in selected_questions)
        if total_time < 15:
            total_time = 30

        return {
            "id": str(random.randint(10000, 99999)),
            "questions": selected_questions,
            "total_time": total_time,
            "rules": {
                "allowCopyPaste": False,
                "allowAITools": False,
                "preventTabSwitching": True,
                "preventMinimization": True,
                "trackIP": True
            },
            "skillsAssessed": skills
        }
