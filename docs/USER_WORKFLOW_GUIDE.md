# HIRICA 2.0 — End-to-End User Demonstration & Workflow Guide

HIRICA is an AI-native Talent Acquisition & Candidate Intelligence Platform. It combines structured job requisitions, semantic resume evidence parsing, anti-cheat proctored assessments, adaptive AI interviews, and an 8-agent candidate intelligence dossier on a single auditable canvas.

---

## Complete End-to-End Demonstration Script

### Step 1: Launch the Platform from Root
- **FastAPI Backend**: `python -m uvicorn api.main:app --host 127.0.0.1 --port 8000`
- **Vite Frontend**: `npm run dev` (Available on `http://127.0.0.1:5173`)

### Step 2: Recruiter Requisition Creation
1. Navigate to `/recruiter/login` and log in.
2. In the sidebar, click **Job Requisitions** (`/job-posting`).
3. Enter Title (e.g. `Senior AI / Python Engineer`), Department, and Key Skills.
4. Click **Auto-Generate with Groq AI** to draft role requirements and responsibilities.
5. In Step 3, configure proctoring rules (prevent tab switching, question count) and click **Run Pre-Publish Simulation**.
6. Click **Publish Requisition** to store the job.

### Step 3: Candidate Application & Evidence Match
1. Open the **Candidate Portal** (`/jobseeker/dashboard`).
2. Select the published requisition.
3. Click **Apply & Upload CV** (`/job/:id`).
4. Upload a resume file (`.pdf`, `.docx`, or `.txt`).
5. PyMuPDF extracts the structured resume text on the server.
6. The ATS engine computes an instant qualification score citing actual project bullets.
7. Click **Confirm Application Submission**.

### Step 4: Proctored Technical Assessment
1. The recruiter reviews the application and clicks **Assign Assessment**.
2. The candidate opens the assessment (`/assessment/:id`).
3. Review telemetry rules and click **Begin Proctored Assessment**.
4. Complete the multiple-choice, written, and coding questions.
5. The client-side telemetry recorder tracks tab switches or focus loss.
6. Click **Submit Proctored Exam**.
7. The backend evaluates answers against competency rubrics and redirects to `/results/:id`.

### Step 5: Adaptive AI Interview
1. Click **Launch Adaptive AI Interview** (`/interview/:id`).
2. Groq LLaMA-3.1 initiates a multi-turn conversational interview probing identified skill gaps.
3. The candidate submits answers in real time, and the AI evaluates depth and clarity.
4. On completion, the interview score and transcript are saved to the candidate record.

### Step 6: Candidate Intelligence Dossier & Human Decision
1. In the recruiter console, open the candidate's **Dossier** (`/dossier/:id`).
2. **Tab 1 (Executive Summary)**: Review composite score, assessment performance, and interview rating.
3. **Tab 2 (Competency Evidence Graph)**: View traceable evidence nodes connecting skills to resume citations and test questions.
4. **Tab 3 (8-Agent Audit)**: Inspect the findings from all 8 autonomous agents.
5. **Tab 4 (Fairness & Governance)**: Confirm algorithmic bias checks and objective criteria.
6. **Tab 5 (Offer Workflow)**: Configure salary, equity, and start date, then click **Save & Roll Out Offer**.

---

## Feature Traceability Matrix

| Feature | Endpoint / Route | Persisted Record |
| :--- | :--- | :--- |
| **Evidence-Based ATS** | `POST /api/evaluate-resume` | `applications.aiMatchScore` |
| **Assessment Blueprint** | `POST /api/generate-assessment` | `assessments.questions` |
| **Proctored Assessment** | `POST /api/evaluate-answers` | `assessments.score` |
| **8-Agent Pipeline** | `POST /api/multi-agent-eval` | `applications.agentPipeline` |
| **Adaptive AI Interview** | `POST /api/ai-interview/turn` | `applications.interviewScore` |
| **Main Settings** | `/settings` | User & Org state |
| **Offer Rollout** | `/dossier/:id` (Tab 5) | `applications.offerDetails` |
