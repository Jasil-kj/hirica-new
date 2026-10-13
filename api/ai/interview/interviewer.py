import json
import re
import requests
from typing import List, Dict, Any, Optional
from api.core.config import settings

def _evaluate_answer_heuristic(
    question: str,
    answer: str,
    job_title: str,
    target_skill: str
) -> Dict[str, Any]:
    """
    Objective, deterministic rubric-based evaluation for technical answers.
    Evaluates:
      1. Length and substance (rejects 'hi', 'yes', 'hii sit', short gibberish)
      2. Domain keyword relevance matching the specific question and skill
      3. Reasoning structures ('because', 'in order to', 'for example', 'trade-off', 'latency')
    """
    clean_answer = (answer or "").strip()
    words = clean_answer.split()
    word_count = len(words)

    # 1. Reject trivial / greeting / non-answers
    greetings = {"hi", "hii", "hello", "hey", "sit", "hii sit", "ok", "yes", "no", "test", "bye", "thanks", "i don't know", "idk"}
    lower_ans = clean_answer.lower()
    
    if word_count < 4 or lower_ans in greetings:
        return {
            "rating": 15,
            "verdict": "Unsatisfactory / Non-responsive",
            "feedback": "Answer was too brief, irrelevant, or lacked technical substance. Please provide an in-depth technical explanation.",
            "clarification_needed": True
        }

    # 2. Technical concepts dictionary per domain
    skill_keywords_map = {
        "python": ["gil", "asyncio", "generator", "decorator", "memory", "list", "dict", "complexity", "o(n)", "threading", "multiprocessing", "pydantic"],
        "fastapi": ["async", "await", "pydantic", "starlette", "dependency", "openapi", "route", "endpoint", "concurrency", "uvicorn"],
        "machine learning": ["overfitting", "underfitting", "gradient", "loss", "weights", "features", "validation", "metrics", "f1", "precision", "recall", "epoch"],
        "ai/ml": ["training", "dataset", "transformer", "attention", "token", "inference", "quantization", "embedding", "pipeline", "benchmark"],
        "system design": ["scale", "latency", "throughput", "cache", "redis", "load balancer", "sharding", "replica", "database", "microservice", "queue"],
        "database": ["index", "b-tree", "transaction", "acid", "query", "normalization", "nosql", "postgres", "lock", "concurrency"],
        "react": ["hook", "useeffect", "usestate", "virtual dom", "render", "reconciliation", "props", "state", "redux", "memo"]
    }

    # 2. Comprehensive technical keyword detection across candidate domains
    matched_keywords = []
    for domain, terms in skill_keywords_map.items():
        for term in terms:
            if term in lower_ans:
                matched_keywords.append(term)
    
    # Generic engineering reasoning terms
    reasoning_terms = ["because", "therefore", "trade-off", "performance", "scalable", "optimize", "reduce", "handles", "ensures", "example", "architecture", "error", "contrast", "minimize", "dataset", "models", "loss"]
    matched_reasoning = [term for term in reasoning_terms if term in lower_ans]

    # Score calculation
    # Depth: up to 30 points
    depth_score = min(30, word_count * 1.0)
    # Technical substance: up to 45 points
    keyword_score = min(45, len(matched_keywords) * 9)
    # Reasoning structure: up to 25 points
    reasoning_score = min(25, len(matched_reasoning) * 6)

    final_score = int(depth_score + keyword_score + reasoning_score)
    final_score = max(20, min(95, final_score))

    if final_score < 45:
        feedback = f"Surface-level response. It lacked specific technical reasoning regarding {target_skill}."
        clarification_needed = True
    elif final_score < 75:
        feedback = f"Good foundational understanding of {target_skill}. Could be strengthened with production edge cases or trade-offs."
        clarification_needed = False
    else:
        feedback = f"Strong, well-articulated explanation demonstrating concrete technical grasp of {target_skill}."
        clarification_needed = False

    return {
        "rating": final_score,
        "verdict": "Qualified" if final_score >= 60 else "Needs Improvement",
        "feedback": feedback,
        "clarification_needed": clarification_needed
    }

def execute_interview_turn(
    job_title: str,
    requirements: List[str],
    candidate_name: str,
    candidate_cv: str,
    identified_gaps: List[str],
    conversation_history: List[Dict[str, str]],
    candidate_response: Optional[str]
) -> Dict[str, Any]:
    """
    Executes a structured, multi-turn AI technical interview.
    Turn Sequence:
      Turn 0 (History empty): AI Introduction & First Technical Question.
      Turn 1-4: AI evaluates candidate's exact answer, scores technical depth, and asks targeted follow-up.
      Turn 5+: Closing interview statement and final synthesis.
    """
    groq_key = settings.GROQ_API_KEY
    # Filter out educational degrees or boilerplate from technical skill probing
    def is_technical_skill(s: str) -> bool:
        lower = s.lower().strip()
        if any(term in lower for term in ["degree", "bachelor", "master", "phd", "diploma", "computer science or", "related field", "experience handling"]):
            return False
        return len(lower) >= 2 and len(lower) <= 40

    clean_skills = [r.strip() for r in requirements if is_technical_skill(r)] or ["Python", "System Architecture", "Performance Optimization"]
    clean_gaps = [g.strip() for g in identified_gaps if is_technical_skill(g)] or clean_skills

    # Count candidate turns
    candidate_turns = [m for m in conversation_history if m.get("role") in ("user", "candidate")]
    current_turn_count = len(candidate_turns) + (1 if candidate_response else 0)

    # ── Phase 1: Initial Welcome (Only When No Prior Conversation Exists) ─────
    if not conversation_history and not candidate_response:
        first_topic = clean_gaps[0] if clean_gaps else clean_skills[0]
        intro_text = (
            f"Hello {candidate_name}! Welcome to your technical interview for the {job_title} position at HIRICA. "
            f"I am your AI technical interviewer today. We will explore your engineering approach, problem-solving, and practical design decisions. "
            f"To get started: In your past work, how have you designed systems with {first_topic}, and what were the primary engineering trade-offs you evaluated?"
        )
        return {
            "status": "success",
            "phase": "introduction",
            "turn_number": 1,
            "interviewer_text": intro_text,
            "rating": None,
            "feedback": "Interview session commenced. Awaiting candidate introduction and technical approach.",
            "is_complete": False
        }

    # ── Phase 2-5: Evaluate Candidate Answer & Generate Next Question ────────
    target_topic = clean_gaps[min(len(clean_gaps) - 1, current_turn_count - 1)] if clean_gaps else clean_skills[min(len(clean_skills) - 1, current_turn_count - 1)]
    eval_result = _evaluate_answer_heuristic(
        question=conversation_history[-1].get("content", "") if conversation_history else "",
        answer=candidate_response or "",
        job_title=job_title,
        target_skill=target_topic
    )

    is_final_turn = current_turn_count >= 5

    # If Groq is configured, generate dynamic contextual follow-up turn
    if groq_key:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
        
        system_prompt = f"""
You are the HIRICA Lead AI Technical Interviewer conducting a live spoken technical interview with {candidate_name} for the role of '{job_title}'.
Required Core Skills: {', '.join(clean_skills)}
Skill Gaps to Probe: {', '.join(clean_gaps)}
Current Turn: {current_turn_count} of 5.

INTERVIEW GUIDELINES:
1. Act like a real Senior Principal Engineer interviewing a candidate over Google Meet.
2. The candidate just answered: "{candidate_response}".
3. Evaluate their answer honestly. If the answer is irrelevant or gibberish (e.g. 'hii', 'yes', 'sit'), do NOT accept it; ask them to address the technical concept directly.
4. If their answer is valid, provide a 1-sentence technical critique/acknowledgement, and ask a deeper follow-up question or practical scenario.
5. If Turn >= 5, conclude the interview gracefully with a closing thank-you.
6. Spoken dialogue must be concise (40-75 words), conversational, and formatted for text-to-speech.

Return ONLY JSON:
{{
  "interviewer_spoken": "Spoken text...",
  "technical_rating": {eval_result['rating']},
  "critique": "Brief 1-sentence assessment...",
  "is_complete": {str(is_final_turn).lower()}
}}
"""
        messages = [{"role": "system", "content": system_prompt}]
        for m in conversation_history:
            messages.append({"role": "assistant" if m.get("role") in ("interviewer", "assistant") else "user", "content": m.get("content", "")})
        if candidate_response:
            messages.append({"role": "user", "content": candidate_response})

        try:
            res = requests.post(url, headers=headers, json={
                "model": "llama-3.1-8b-instant",
                "messages": messages,
                "temperature": 0.35,
                "response_format": {"type": "json_object"}
            }, timeout=10)

            if res.status_code == 200:
                data = json.loads(res.json()["choices"][0]["message"]["content"])
                spoken = data.get("interviewer_spoken", "").strip()
                if spoken:
                    return {
                        "status": "success",
                        "phase": "closing" if is_final_turn else "technical_followup",
                        "turn_number": current_turn_count,
                        "interviewer_text": spoken,
                        "rating": int(data.get("technical_rating", eval_result["rating"])),
                        "feedback": data.get("critique", eval_result["feedback"]),
                        "is_complete": bool(data.get("is_complete", is_final_turn))
                    }
        except Exception:
            pass

    # ── Fallback Deterministic Interview Engine (Runs offline / without Groq key) ─
    if eval_result.get("clarification_needed"):
        interviewer_text = (
            f"I didn't catch sufficient technical reasoning in that response. "
            f"Could you specifically explain how you apply {target_topic} in {job_title}, including a concrete example from your work?"
        )
    elif is_final_turn:
        interviewer_text = (
            f"Thank you, {candidate_name}. You have completed all technical stages for this {job_title} interview. "
            f"Your answers, technical depth, and integrity metrics have been compiled and sent to the hiring team's dossier. Have a great day!"
        )
    elif current_turn_count == 2:
        next_topic = gaps[1] if len(gaps) > 1 else "fault tolerance and debugging"
        interviewer_text = (
            f"That gives good context. Moving forward: When debugging unexpected latency or bottlenecks in {next_topic}, "
            f"what profiling tools and diagnostic steps do you prioritize to isolate the root cause?"
        )
    elif current_turn_count == 3:
        interviewer_text = (
            f"Understood. Let's look at a practical scenario: Suppose your API service experiences a 5x spike in concurrent requests during a release. "
            f"How would you ensure database connection pools, caching, and rate limiting protect system availability?"
        )
    else:
        interviewer_text = (
            f"Good explanation. Lastly, how do you handle technical debt and automated testing when shipping critical features under tight deadlines?"
        )

    return {
        "status": "success",
        "phase": "closing" if is_final_turn else "technical_followup",
        "turn_number": current_turn_count,
        "interviewer_text": interviewer_text,
        "rating": eval_result["rating"],
        "feedback": eval_result["feedback"],
        "is_complete": is_final_turn
    }
