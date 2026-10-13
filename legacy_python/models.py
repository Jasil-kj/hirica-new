from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin, LoginManager
from flask_mail import Mail
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'recruiter' or 'jobseeker'
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    recruiter_profile = db.relationship('RecruiterProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    jobseeker_profile = db.relationship('JobSeekerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.email}>'

class RecruiterProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    position = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    mobile_number = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='recruiter', lazy='dynamic', cascade='all, delete-orphan')

class JobSeekerProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    mobile_number = db.Column(db.String(20), nullable=False)
    linkedin_id = db.Column(db.String(200))
    github_id = db.Column(db.String(200))
    resume_filename = db.Column(db.String(200))
    skills = db.Column(db.Text)
    experience = db.Column(db.Text)
    education = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='jobseeker', lazy='dynamic', cascade='all, delete-orphan')

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey('recruiter_profile.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text, nullable=False)
    responsibilities = db.Column(db.Text, nullable=False)
    skills_needed = db.Column(db.Text, nullable=False)  # Comma-separated
    salary = db.Column(db.String(100))
    location = db.Column(db.String(200), nullable=False)
    job_type = db.Column(db.String(50), nullable=False)  # Full-time, Part-time, Internship
    experience_level = db.Column(db.String(50), nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, paused, expired, deleted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def is_expired(self):
        return datetime.utcnow().date() > self.expiry_date
    
    @property
    def skills_list(self):
        return [skill.strip() for skill in self.skills_needed.split(',') if skill.strip()]

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    jobseeker_id = db.Column(db.Integer, db.ForeignKey('job_seeker_profile.id'), nullable=False)
    cover_letter = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime)
    
    # Relationships
    assessment = db.relationship('Assessment', backref='application', uselist=False, cascade='all, delete-orphan')

class Assessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('application.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    instructions = db.Column(db.Text)
    total_questions = db.Column(db.Integer, default=0)
    duration_minutes = db.Column(db.Integer, default=60)
    status = db.Column(db.String(20), default='draft')  # draft, published, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
    # Relationships
    questions = db.relationship('Question', backref='assessment', lazy='dynamic', cascade='all, delete-orphan')
    submissions = db.relationship('AssessmentSubmission', backref='assessment', uselist=False, cascade='all, delete-orphan')

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessment.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # mcq, coding, descriptive, project
    options = db.Column(db.Text)  # JSON string for MCQ options
    correct_answer = db.Column(db.Text)
    time_limit_minutes = db.Column(db.Integer, default=5)
    order_number = db.Column(db.Integer, nullable=False)
    
    # Rules
    allow_copy_paste = db.Column(db.Boolean, default=False)
    allow_tab_switch = db.Column(db.Boolean, default=False)
    allow_minimize = db.Column(db.Boolean, default=False)
    require_webcam = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def options_list(self):
        if self.options:
            return json.loads(self.options)
        return []
    
    @options_list.setter
    def options_list(self, value):
        self.options = json.dumps(value)

class AssessmentSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessment.id'), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    submitted_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='in_progress')  # in_progress, completed, graded
    total_score = db.Column(db.Float)
    max_score = db.Column(db.Float)
    violations = db.Column(db.Text)  # JSON string for rule violations
    
    # Relationships
    answers = db.relationship('Answer', backref='submission', lazy='dynamic', cascade='all, delete-orphan')

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('assessment_submission.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    answer_text = db.Column(db.Text)
    code_answer = db.Column(db.Text)
    code_output = db.Column(db.Text)
    code_language = db.Column(db.String(50))
    file_path = db.Column(db.String(200))  # For project submissions
    time_taken = db.Column(db.Integer)  # seconds
    violations = db.Column(db.Text)  # JSON string for violations
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    question = db.relationship('Question', backref='answers')

class ProjectTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessment.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text)
    deadline_hours = db.Column(db.Integer, default=72)  # hours from assignment
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    submissions = db.relationship('ProjectSubmission', backref='project_task', cascade='all, delete-orphan')

class ProjectSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_task_id = db.Column(db.Integer, db.ForeignKey('project_task.id'), nullable=False)
    file_path = db.Column(db.String(200), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    feedback = db.Column(db.Text)  # Recruiter feedback
    score = db.Column(db.Float)    # Recruiter score
