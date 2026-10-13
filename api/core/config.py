import os
from dotenv import load_dotenv

# Try root .env.local, then Backend/.env
root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))
backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Backend', '.env'))

if os.path.exists(root_env):
    load_dotenv(root_env)
if os.path.exists(backend_env):
    load_dotenv(backend_env)

class Settings:
    PROJECT_NAME: str = "HIRICA AI Recruitment Intelligence Platform"
    VERSION: str = "2.0.0"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    # Allowed CORS Origins
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Credential path fallback
    _default_cred_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Backend', 'firebase-credentials.json'))
    _archive_cred_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'legacy_backend_archive', 'firebase-credentials.json'))
    FIREBASE_CREDENTIALS_PATH: str = os.getenv(
        "FIREBASE_CREDENTIALS_PATH",
        _archive_cred_path if os.path.exists(_archive_cred_path) else _default_cred_path
    )

settings = Settings()
