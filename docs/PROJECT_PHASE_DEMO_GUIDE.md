# HIRICA 2.0 — Project Phase Demonstration Guide

**Project Name**: HIRICA 2.0 (Autonomous Multi-Agent AI Recruitment Intelligence Platform)  
**Target Audience**: Academic Evaluators, Project Guides, Demonstration Examiners, and Project Teammates  
**Status**: Demonstrable End-to-End Workflow Verified  

---

## 1. System Overview & Demonstration Objectives

The objective of this demonstration is to show a complete, working recruitment lifecycle that connects job competency definition, resume parsing, ATS matching, proctored assessment, adaptive AI interviewing, multi-agent candidate evaluation, and human recruiter decision-making on a single auditable platform.

### What is Real and Verified:
- **FastAPI Backend (`http://127.0.0.1:8000`)**: Live Python server providing real NLP, resume extraction, assessment question generation, interview conversational turns, and 8-agent evaluation orchestration.
- **Groq LLaMA-3.1 Inference**: Live generative AI inference for job drafting and interview probe formulations.
- **PyMuPDF File Processing**: Real text and skill extraction from uploaded PDF and DOCX files.
- **MediaPipe On-Device Computer Vision**: Runs directly in the browser to detect candidate presence without uploading raw video streams to any cloud server.
- **Firebase Authentication & Cloud Firestore**: Real cloud database storing jobs, applications, assessments, and offer terms.

---

## 2. Startup Commands & Prerequisites

### Services Required:
1. **Python Virtual Environment (`.venv`)**: Python 3.12 with FastAPI, Uvicorn, PyMuPDF, python-docx, and Firebase Admin.
2. **Node.js & Vite**: Frontend UI dependencies.
3. **Active Ports**:
   - Backend API: `http://127.0.0.1:8000`
   - Frontend App: `http://localhost:5173`

### Command 1: Start Backend API Server
Open PowerShell in the project directory:
```powershell
.\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
*Expected output*: `Application startup complete. Uvicorn running on http://127.0.0.1:8000`

### Command 2: Start Frontend Development Server
Open a second PowerShell window:
```powershell
npm run dev
```
*Expected output*: `VITE v5.4.19 ready in ~300 ms -> Local: http://localhost:5173/`

### Command 3: Run Automated Verification Tests (Optional for Evaluators)
```powershell
.\.venv\Scripts\python.exe -m pytest tests/
```
*Expected output*: `14 passed in ~1.0s (100% pass rate)`

---

## 3. Step-by-Step Demonstration Sequence (The 10 Steps)

Follow this exact sequence to demonstrate the entire platform in 8–10 minutes:

### Step 1: Recruiter Registration & Dashboard Access
1. Open `http://localhost:5173/` in Google Chrome or Edge.
2. Click **"Launch Recruiter Console"** or navigate to `http://localhost:5173/recruiter/login`.
3. If creating a fresh account, click **"Create new recruiter account"**:
   - Name: `Alex Johnson`
   - Company: `NovaTech AI Solutions`
   - Email: `recruiter.demo@novatech.ai`
   - Password: `password123`
4. **Demonstration Point**: Point out the clean architectural CAD grid design, high-contrast typography, and live status badges indicating multi-agent engine connectivity.

### Step 2: AI-Powered Job Requisition Creation
1. From the top navigation or sidebar, click **"Post Requisition"** (`/recruiter/post-job` or `/job-posting`).
2. In **Step 1 (Role Architecture)**, enter:
   - Job Title: `AI/ML Engineer`
   - Department: `Engineering & Technology`
   - Seniority: `Mid-Senior Level`
   - Primary Skills: `Python`, `PyTorch`, `FastAPI`, `Docker`, `LLMs`
3. Click **"Generate Complete Job Description with AI"**:
   - The backend calls Groq LLaMA-3.1 via FastAPI.
   - Watch the AI automatically formulate the structured job overview, key responsibilities, and required qualifications.
4. Click **"Continue to Pipeline Configuration ➔"**.

### Step 3: Anti-Cheat & Workflow Pre-Publish Simulation
1. In **Step 2 (Pipeline & Proctoring Stages)**:
   - Review the proctoring switches (e.g. Prevent Tab Switching, Restrict External Copy/Paste).
2. Click **"Run Pre-Publish Hiring Simulation"**:
   - The backend simulates applicant volume, question difficulty spread, and estimated pipeline drop-off rates.
3. Review the simulation results in **Step 3 (Pre-Publish Readiness)**.
4. Click **"Confirm & Publish Requisition 🚀"**:
   - The requisition is written directly to Google Cloud Firestore in the `jobs` collection.

### Step 4: Candidate Browsing & Portal View
1. Open an Incognito window or log out and visit `http://localhost:5173/jobseeker/login`.
2. Register a candidate account:
   - Name: `Sarah Chen`
   - Email: `sarah.chen@example.com`
   - Password: `password123`
3. On the **Candidate Career Portal** (`/jobseeker/dashboard`), the published `AI/ML Engineer` job is immediately visible.
4. Click **"Review & Apply"** on the job card.

### Step 5: Resume Parsing & Semantic ATS Evaluation
1. On the Job Detail page, click **"Apply & Upload CV 📄"**.
2. Upload a sample PDF or TXT resume (or paste text):
   - *Sample Candidate Experience*:
     > *"Senior Python Developer with 4 years of experience building scalable APIs in FastAPI and training PyTorch deep learning models. Deployed Docker microservices on AWS."*
3. **Demonstration Point**:
   - PyMuPDF parses the document instantly.
   - The backend computes a real ATS Match Score (e.g., 88% Match), highlights verified skills (`Python`, `FastAPI`, `PyTorch`, `Docker`), flags missing gaps, and displays an executive summary.
4. Click **"Confirm Application Submission ➔"**.

### Step 6: Anti-Cheat Proctored Assessment
1. The candidate clicks **"Take Assessment ⚡"** on their dashboard.
2. **Demonstration Point (Integrity System)**:
   - Point out the instructions noting that tab-switching and clipboard pasting are intercepted.
   - If camera access is granted, the browser executes the `@mediapipe/tasks-vision` face detector locally.
3. Answer the technical questions (multiple choice, written explanation, and coding).
4. Click **"Submit Proctored Exam 🚀"**:
   - The answers are evaluated and saved to Firestore.

### Step 7: Adaptive AI Technical Interview
1. Open the application's AI interview session (`/interview/:applicationId`).
2. The AI Interviewer introduces itself and asks a targeted question focusing on system architecture.
3. Type a candidate response explaining architecture trade-offs (e.g., *"We used asynchronous worker queues with Celery and Redis to handle burst traffic"*).
4. **Demonstration Point**:
   - The AI evaluates the turn score and dynamically formulates a contextual technical follow-up probe.

### Step 8: Recruiter Review & Candidate Dossier
1. Switch back to the Recruiter window (`/recruiter/dashboard`).
2. Click on the requisition's **"Applicants"** button.
3. Click **"Inspect Full Dossier ➔"** (`/dossier/:applicationId`).
4. **Demonstration Point (Unified Dossier)**:
   - Walk through the tabs:
     - **Overview**: ATS Score, assessment score, integrity risk, and recommendation.
     - **Competency Graph**: Interactive evidence mapping.
     - **Fairness Audit**: NIST Trustworthy AI compliance checklist verifying zero demographic proxy bias.

### Step 9: 8-Agent Evaluation Pipeline
1. In the Candidate Dossier, click the **"8-Agent AI Engine"** tab.
2. Click **"Run 8-Agent Pipeline"**:
   - Point out the 8 distinct agents executing in sequence:
     1. `Job Agent`: Decomposes competency weights.
     2. `Resume Agent`: Extracts empirical resume evidence.
     3. `Assessment Agent`: Verifies question coverage.
     4. `Interview Agent`: Evaluates interview transcripts.
     5. `Integrity Agent`: Decouples telemetry from skill.
     6. `Ranking Agent`: Computes composite score.
     7. `Decision Agent`: Synthesizes explainable recommendation.
     8. `Fairness Auditor`: Audits bias signals.

### Step 10: Human Recruiter Decision & Offer Preparation
1. Click the **"Prepare Offer 📄"** tab or header action.
2. Enter the hiring terms:
   - Salary: `$140,000 / year`
   - Start Date: `First of next month`
   - Equity: `0.15% Stock Options`
3. Click **"Shortlist Candidate"** or **"Save & Prepare Formal Offer"**.
4. Refresh the page to prove that the candidate's status persists in the database as `selected`.

---

## 4. Known Limitations & Backup Demonstration Plan

- **Coding Sandbox Execution**: The coding questions in the assessment accept and evaluate candidate algorithm structure, but do not execute untrusted binaries in an isolated Docker sandbox. Be transparent: explain that code answers are evaluated via competency rubrics.
- **Camera Lighting**: If the camera has poor lighting or permission is blocked, explain that MediaPipe runs purely client-side for privacy and that camera telemetry is decoupled so candidates are never auto-disqualified for hardware glitches.
- **Backup Data**: If an internet disruption slows down the cloud database, the application gracefully provides structured fallbacks for instant response demonstration.
