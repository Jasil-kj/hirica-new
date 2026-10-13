# HIRICA: Autonomous AI Recruitment, Assessment & Integrity Intelligence Platform

**Final-Year AIML Capstone Project**  
*An end-to-end recruitment intelligence system combining semantic ATS scoring, dynamic LLM assessment generation, browser proctoring telemetry, an 8-agent autonomous evaluation pipeline, NIST Trustworthy AI fairness auditing, and an adaptive conversational AI technical interviewer.*

---

## 🏛️ System Architecture

```
HIRICA/
├── api/                                # FastAPI Backend & AI/ML Core
│   ├── main.py                         # Single Primary FastAPI Application Entrypoint
│   ├── routes/                         # Modular Route Handlers
│   ├── ai/                             # AIML Intelligence Subsystems
│   │   ├── agents/                     # 8 Specialized Autonomous Agents + NIST AI Auditor
│   │   │   └── recruitment_agents.py
│   │   ├── assessment/                 # Technical Test Generation & Semantic Answer Grading
│   │   │   ├── generator.py
│   │   │   └── evaluator.py
│   │   ├── resume/                     # Document Parser & Semantic ATS Engine
│   │   │   ├── parser.py
│   │   │   └── ats.py
│   │   ├── interview/                  # Conversational AI Technical Interview Engine
│   │   │   └── interviewer.py
│   │   └── orchestration/              # Multi-Agent Pipeline Orchestration
│   │       └── pipeline.py
│   ├── services/                       # Application Services (Firebase, Cloud Storage)
│   ├── schemas/                        # Pydantic Request & Response Contracts
│   └── core/                           # Configuration & Security Settings
│
├── frontend/                           # React 18 + Vite + Tailwind CSS Web Portal
│   ├── src/
│   │   ├── pages/                      # Role-Based Views (Recruiter & Job Seeker)
│   │   ├── components/                 # Reusable UI & Anti-Cheat Monitor
│   │   ├── services/                   # Frontend API Clients & Firestore Integration
│   │   └── contexts/                   # Authentication & Session State
│
├── docs/                               # Academic & Technical Architecture Documentation
│   ├── architecture/
│   ├── ai/
│   └── api/
│
├── tests/                              # Automated Test Suites
│
├── .env.example                        # Sanitized Environment Variable Template
├── .gitignore                          # Excludes secrets, .venv, *.db, and credentials
└── requirements.txt                    # Backend Python Dependencies
```

---

## 🤖 AI / ML Architecture & Agent Pipeline

### The 8 Specialized Autonomous Agents:
1. **Job Competency Agent:** Deconstructs job requirements into structured competencies and assigns normalized skill weights.
2. **Resume Evidence Agent:** Scans candidate CVs to extract concrete evidence points and identifies technical skill gaps.
3. **Assessment Generation Agent:** Synthesizes mixed-format questions (MCQ, Coding, Conceptual Written) ensuring 100% competency coverage.
4. **Interview Investigator Agent:** Generates targeted technical interview questions probing identified candidate skill gaps.
5. **Integrity Agent:** Analyzes real-time proctoring telemetry (tab switching, window blur, clipboard attempts) to calculate an explainable trust score.
6. **Candidate Ranking Agent:** Computes a composite hiring score using the formula:  
   $$\text{Composite Score} = (0.40 \times \text{ATS Evidence}) + (0.50 \times \text{Technical Test}) + (0.10 \times \text{Integrity Trust})$$
7. **Decision Agent:** Synthesizes multi-agent signals to produce an explainable verdict: `STRONG HIRE`, `HIRE / INTERVIEW`, `REJECT / HOLD`, or `INTEGRITY VIOLATION`.
8. **AI Fairness Auditor:** Audits the recommendation against the **NIST Trustworthy AI Governance Framework** across 5 dimensions:
   - Technical Evidence Verification (✓)
   - Experience Relevance Fit (✓)
   - Assessment Consistency (✓)
   - Decision Explainability (✓)
   - Potential Proxy Bias Signals (✓ / ⚠)

---

## 🚀 Running the Platform

### 1. Backend API (FastAPI)
```powershell
# In project root:
.\Backend\.venv\Scripts\uvicorn.exe api.main:app --reload --port 8000
```
- API Health Check: `http://localhost:8000/api/health`
- Swagger Interactive Documentation: `http://localhost:8000/docs`

### 2. Frontend Web Portal (Vite + React)
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🔒 Security & Credential Management
- Sensitive keys (`GROQ_API_KEY`, Firebase private keys) are isolated in `.env.local` and ignored by Git.
- Never commit `firebase-credentials.json` or `.env` files.
