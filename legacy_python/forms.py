from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField, TextAreaField, PasswordField, SelectField, DateField, IntegerField, BooleanField, HiddenField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Optional
from wtforms.widgets import TextArea
from datetime import datetime, timedelta

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])

class RecruiterRegisterForm(FlaskForm):
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=200)])
    company_name = StringField('Company Name', validators=[DataRequired(), Length(min=2, max=200)])
    location = StringField('Location', validators=[DataRequired(), Length(min=2, max=200)])
    position = StringField('Your Position', validators=[DataRequired(), Length(min=2, max=200)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    mobile_number = StringField('Mobile Number', validators=[Optional(), Length(min=10, max=20)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', 
                                   validators=[DataRequired(), EqualTo('password')])

class JobSeekerRegisterForm(FlaskForm):
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=200)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    mobile_number = StringField('Mobile Number', validators=[DataRequired(), Length(min=10, max=20)])
    linkedin_id = StringField('LinkedIn Profile (Optional)', validators=[Optional()])
    github_id = StringField('GitHub Profile (Optional)', validators=[Optional()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', 
                                   validators=[DataRequired(), EqualTo('password')])

class JobForm(FlaskForm):
    title = StringField('Job Title', validators=[DataRequired(), Length(min=2, max=200)])
    description = TextAreaField('Job Description', validators=[DataRequired()])
    requirements = TextAreaField('Requirements', validators=[DataRequired()])
    responsibilities = TextAreaField('Responsibilities', validators=[DataRequired()])
    skills_needed = TextAreaField('Skills Needed (comma-separated)', validators=[DataRequired()])
    salary = StringField('Salary Range', validators=[Optional()])
    location = StringField('Job Location', validators=[DataRequired(), Length(min=2, max=200)])
    job_type = SelectField('Job Type', choices=[
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Internship', 'Internship')
    ], validators=[DataRequired()])
    experience_level = SelectField('Experience Level', choices=[
        ('Entry Level', 'Entry Level'),
        ('Mid Level', 'Mid Level'),
        ('Senior Level', 'Senior Level'),
        ('Executive Level', 'Executive Level')
    ], validators=[DataRequired()])
    expiry_date = DateField('Application Deadline', validators=[DataRequired()])

class ProfileForm(FlaskForm):
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=200)])
    mobile_number = StringField('Mobile Number', validators=[DataRequired(), Length(min=10, max=20)])
    linkedin_id = StringField('LinkedIn Profile (Optional)', validators=[Optional()])
    github_id = StringField('GitHub Profile (Optional)', validators=[Optional()])
    skills = TextAreaField('Skills', validators=[Optional()])
    experience = TextAreaField('Experience', validators=[Optional()])
    education = TextAreaField('Education', validators=[Optional()])
    resume = FileField('Resume', validators=[FileAllowed(['pdf', 'doc', 'docx'], 'Only PDF and DOC files allowed!')])

class ApplicationForm(FlaskForm):
    cover_letter = TextAreaField('Cover Letter', validators=[DataRequired(), Length(min=50)], widget=TextArea())

class QuestionForm(FlaskForm):
    question_text = TextAreaField('Question', validators=[DataRequired()])
    question_type = SelectField('Question Type', choices=[
        ('mcq', 'Multiple Choice'),
        ('coding', 'Coding'),
        ('descriptive', 'Descriptive'),
    ], validators=[DataRequired()])
    time_limit_minutes = IntegerField('Time Limit (minutes)', validators=[DataRequired()], default=5)
    
    # MCQ specific
    option_a = StringField('Option A', validators=[Optional()])
    option_b = StringField('Option B', validators=[Optional()])
    option_c = StringField('Option C', validators=[Optional()])
    option_d = StringField('Option D', validators=[Optional()])
    correct_answer = StringField('Correct Answer', validators=[Optional()])
    
    # Rules
    allow_copy_paste = BooleanField('Allow Copy-Paste', default=False)
    allow_tab_switch = BooleanField('Allow Tab Switching', default=False)
    allow_minimize = BooleanField('Allow Window Minimize', default=False)
    require_webcam = BooleanField('Require Webcam', default=False)

class AssessmentForm(FlaskForm):
    title = StringField('Assessment Title', validators=[DataRequired(), Length(min=2, max=200)])
    instructions = TextAreaField('Instructions', validators=[Optional()])
    duration_minutes = IntegerField('Duration (minutes)', validators=[DataRequired()], default=60)

class AnswerForm(FlaskForm):
    question_id = HiddenField()
    answer_text = TextAreaField('Answer', validators=[Optional()])
    code_answer = TextAreaField('Code', validators=[Optional()])
    code_language = SelectField('Programming Language', choices=[
        ('python', 'Python'),
        ('javascript', 'JavaScript'),
        ('java', 'Java'),
        ('cpp', 'C++'),
        ('c', 'C'),
        ('html', 'HTML'),
        ('css', 'CSS')
    ], validators=[Optional()])

class ProjectTaskForm(FlaskForm):
    title = StringField('Project Title', validators=[DataRequired(), Length(min=2, max=200)])
    description = TextAreaField('Project Description', validators=[DataRequired()])
    requirements = TextAreaField('Requirements', validators=[Optional()])
    deadline_hours = IntegerField('Deadline (hours)', validators=[DataRequired()], default=72)
