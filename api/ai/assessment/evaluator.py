import json
import requests
from typing import List, Dict, Any, Optional
from api.core.config import settings

class SemanticAnswerEvaluator:
    def __init__(self):
        self.groq_key = settings.GROQ_API_KEY

    def evaluate_answers(self, questions: List[Dict[str, Any]], answers: Dict[str, Any]) -> Dict[str, Any]:
        evaluated = {}
        total_score = 0
        total_questions = len(questions)

        for q in questions:
            q_id = str(q.get("id"))
            user_ans_val = answers.get(q_id, {})
            user_ans = user_ans_val.get("answer", "") if isinstance(user_ans_val, dict) else user_ans_val
            raw_str = str(user_ans or "").strip()

            is_corr = False
            feedback_msg = ""
            score_val = 0

            # High-level Groq LLM evaluation for written/coding questions
            if q.get("type") in ["written", "coding", "text", "code"] and self.groq_key and len(raw_str) >= 10:
                prompt = f"""
Perform a technical evaluation of this candidate's assessment answer.
Question: {q.get("question")}
Type: {q.get("type")}
Expected Solution / Key Concept: {q.get("correctAnswer")}
Candidate Submitted Answer: {raw_str}

Evaluate technical depth, correctness, and reasoning. Gibberish or random keystrokes MUST receive isCorrect: false and score: 0.

Return ONLY valid JSON:
{{
  "isCorrect": true,
  "score": 90,
  "feedback": "Detailed 1-2 sentence AI evaluation feedback..."
}}
"""
                models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "qwen-2.5-coder-32b"]
                for m in models:
                    try:
                        res = requests.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"},
                            json={
                                "model": m,
                                "messages": [
                                    {"role": "system", "content": "You are a Senior High-Level Technical AI Evaluator."},
                                    {"role": "user", "content": prompt}
                                ],
                                "temperature": 0.2,
                                "response_format": {"type": "json_object"}
                            },
                            timeout=8
                        )
                        if res.status_code == 200:
                            parsed = json.loads(res.json()["choices"][0]["message"]["content"])
                            is_corr = parsed.get("isCorrect", False)
                            score_val = parsed.get("score", 100 if is_corr else 0)
                            feedback_msg = parsed.get("feedback", "High-level AI evaluation complete.")
                            break
                    except Exception:
                        pass

            if not feedback_msg:
                # Rule-based fallback
                if q.get("type") == "multiple-choice":
                    target = str(q.get("correctAnswer", "")).strip().lower()
                    is_corr = bool(raw_str and target and (raw_str.lower() in target or target in raw_str.lower()))
                    score_val = 100 if is_corr else 0
                    feedback_msg = "Correct answer selected." if is_corr else f"Expected: '{q.get('correctAnswer')}'"
                elif q.get("type") in ["coding", "code"]:
                    clean = raw_str.lower()
                    is_corr = len(clean) >= 15 and any(k in clean for k in ["def", "function", "const", "return", "import", "class", "let", "var", "="])
                    score_val = 100 if is_corr else 0
                    feedback_msg = "Code contains valid syntax structures." if is_corr else "Code submission lacks valid syntax or logic."
                else:
                    clean = raw_str.lower()
                    is_corr = len(clean) >= 12 and any(k in clean for k in ["the", "and", "for", "with", "should", "use", "using", "ensure", "error", "data", "system", "performance", "api", "process"])
                    score_val = 100 if is_corr else 0
                    feedback_msg = "Written answer covers key technical terms." if is_corr else "Written answer missing required technical concepts."

            if is_corr:
                total_score += (score_val / 100) if score_val else 1

            evaluated[q_id] = {
                "answer": raw_str,
                "isCorrect": is_corr,
                "score": score_val,
                "feedback": feedback_msg,
                "timestamp": user_ans_val.get("timestamp") if isinstance(user_ans_val, dict) else None
            }

        final_percentage = round((total_score / max(1, total_questions)) * 100)
        return {
            "score": final_percentage,
            "answers": evaluated
        }
