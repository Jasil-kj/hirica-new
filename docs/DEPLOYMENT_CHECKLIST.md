# HIRICA 2.0 — Deployment Checklist & Production Readiness Guide

This checklist details production deployment requirements for the root-executed HIRICA platform.

---

## 1. Environment & Credentials Security

- [x] **Zero Frontend Secret Exposure**: Private Groq API keys, Firebase service account keys, and backend JWT secrets are stored exclusively in the root `.env` on the server and are NOT exposed via `VITE_` variables.
- [x] **Safe Example Templates**: `.env.example` contains placeholder tokens only.
- [ ] **HTTPS Enforcement**: In production, serve the frontend and FastAPI backend over HTTPS with valid SSL certificates.

---

## 2. Server Startup & Architecture

### Backend (ASGI Production Execution)
Do **NOT** run Uvicorn with `--reload` in production.
```bash
# Production command:
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend (Static Distribution)
```bash
# Build production bundle:
npm run build

# Serve dist/ via Nginx, Cloudflare Pages, or static web server:
npx serve -s dist -l 5173
```

---

## 3. CORS Configuration
In [api/main.py](file:///c:/Users/jasil/OneDrive/Desktop/Hirica-main/api/main.py), configure `allow_origins` to restrict access to the production frontend domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://hirica.yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 4. Health Checks & Smoke Tests
- Backend Health: `GET /api/health` -> returns `{"status": "healthy"}`
- CV Parser: `POST /api/parse-cv-file` with multipart PDF/DOCX
- Groq AI: `POST /api/generate-job-description`
- Multi-Agent: `POST /api/multi-agent-eval`
- AI Interview: `POST /api/ai-interview/turn`
