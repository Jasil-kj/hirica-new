import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy.orm import DeclarativeBase
from utils import get_project_due_at, get_project_time_remaining, send_project_deadline_reminder
from models import ProjectTask, ProjectSubmission, JobSeekerProfile, Assessment, Application, db, login_manager, mail
from flask_apscheduler import APScheduler
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

class Config:
    SCHEDULER_API_ENABLED = True

# Initialize extensions
# db = SQLAlchemy(model_class=Base) # This line is removed as per the edit hint.
# login_manager = LoginManager() # This line is removed as per the edit hint.
# mail = Mail() # This line is removed as per the edit hint.

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.secret_key = os.environ.get("SESSION_SECRET", "hirica-dev-secret-key")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///hirica.db")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Mail configuration
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', '587'))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@hirica.com')
    
    # File upload configuration
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    # AI API configuration
    app.config['GROQ_API_KEY'] = os.environ.get('GROQ_API_KEY', 'default_groq_key')
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    mail.init_app(app)
    app.config.from_object(Config)
    
    # Login manager configuration
    login_manager.login_view = 'auth.choose_role'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    # Create upload directory
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from routes import main_bp, auth_bp, recruiter_bp, jobseeker_bp, admin_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(recruiter_bp, url_prefix='/recruiter')
    app.register_blueprint(jobseeker_bp, url_prefix='/jobseeker')
    app.register_blueprint(admin_bp, url_prefix='/admin')

    # APScheduler setup
    scheduler = APScheduler()
    scheduler.init_app(app)
    scheduler.start()

    @scheduler.task('interval', id='project_deadline_reminders', hours=1, misfire_grace_time=900)
    def project_deadline_reminders():
        with app.app_context():
            now = datetime.utcnow()
            soon_thresholds = [24, 12, 1]  # hours before deadline to send reminders
            projects = ProjectTask.query.all()
            for project in projects:
                due_at = get_project_due_at(project)
                time_left = (due_at - now).total_seconds() / 3600
                # Skip if already submitted
                if project.submissions:
                    continue
                # Send reminders at thresholds
                for threshold in soon_thresholds:
                    if threshold - 0.5 < time_left <= threshold + 0.5:
                        # Find jobseeker email
                        assessment = Assessment.query.get(project.assessment_id)
                        application = Application.query.get(assessment.application_id)
                        jobseeker = JobSeekerProfile.query.get(application.jobseeker_id)
                        if jobseeker and jobseeker.user:
                            send_project_deadline_reminder(jobseeker.user.email, project, int(time_left))
                # Overdue reminder
                if -0.5 < time_left <= 0.5:
                    assessment = Assessment.query.get(project.assessment_id)
                    application = Application.query.get(assessment.application_id)
                    jobseeker = JobSeekerProfile.query.get(application.jobseeker_id)
                    if jobseeker and jobseeker.user:
                        send_project_deadline_reminder(jobseeker.user.email, project, 0)
    
    return app

# Create app instance
app = create_app()

# Create tables
with app.app_context():
    import models  # noqa: F401
    db.create_all()
    logging.info("Database tables created")

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
