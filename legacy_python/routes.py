import os
import json
from datetime import datetime, timedelta
from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, jsonify, send_from_directory
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from models import db, login_manager, mail
from models import User, RecruiterProfile, JobSeekerProfile, Job, Application, Assessment, Question, Answer, AssessmentSubmission, ProjectTask, ProjectSubmission
from forms import LoginForm, RecruiterRegisterForm, JobSeekerRegisterForm, JobForm, ProfileForm, ApplicationForm, QuestionForm, AssessmentForm, AnswerForm, ProjectTaskForm
from utils import generate_verification_token, send_verification_email, save_file, generate_ai_questions, execute_code, calculate_assessment_score, format_datetime, time_ago

# Blueprints
main_bp = Blueprint('main', __name__)
auth_bp = Blueprint('auth', __name__)
recruiter_bp = Blueprint('recruiter', __name__)
jobseeker_bp = Blueprint('jobseeker', __name__)
admin_bp = Blueprint('admin', __name__)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Template filters
@main_bp.app_template_filter('datetime')
def datetime_filter(dt):
    return format_datetime(dt)

@main_bp.app_template_filter('time_ago')
def time_ago_filter(dt):
    return time_ago(dt)

# Main routes
@main_bp.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.user_type == 'recruiter':
            return redirect(url_for('recruiter.dashboard'))
        else:
            return redirect(url_for('jobseeker.dashboard'))
    
    # Get some statistics for landing page
    total_jobs = Job.query.filter_by(status='active').count()
    total_companies = db.session.query(RecruiterProfile.company_name).distinct().count()
    total_jobseekers = JobSeekerProfile.query.count()
    
    return render_template('index.html', 
                         total_jobs=total_jobs,
                         total_companies=total_companies,
                         total_jobseekers=total_jobseekers)

# Auth routes
@auth_bp.route('/choose-role')
def choose_role():
    return render_template('auth/choose_role.html')

@auth_bp.route('/login/<user_type>')
def login(user_type):
    if user_type not in ['recruiter', 'jobseeker']:
        flash('Invalid user type', 'error')
        return redirect(url_for('auth.choose_role'))
    
    form = LoginForm()
    return render_template('auth/login.html', form=form, user_type=user_type)

@auth_bp.route('/login/<user_type>', methods=['POST'])
def login_post(user_type):
    if user_type not in ['recruiter', 'jobseeker']:
        flash('Invalid user type', 'error')
        return redirect(url_for('auth.choose_role'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data, user_type=user_type).first()
        
        if user and user.check_password(form.password.data):
            # Temporarily disable email verification requirement
            # if not user.is_verified:
            #     flash('Please verify your email before logging in.', 'warning')
            #     return render_template('auth/login.html', form=form, user_type=user_type)
            
            login_user(user)
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            
            if user_type == 'recruiter':
                return redirect(url_for('recruiter.dashboard'))
            else:
                return redirect(url_for('jobseeker.dashboard'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('auth/login.html', form=form, user_type=user_type)

@auth_bp.route('/register/<user_type>')
def register(user_type):
    if user_type not in ['recruiter', 'jobseeker']:
        flash('Invalid user type', 'error')
        return redirect(url_for('auth.choose_role'))
    
    if user_type == 'recruiter':
        form = RecruiterRegisterForm()
    else:
        form = JobSeekerRegisterForm()
    
    return render_template('auth/register.html', form=form, user_type=user_type)

@auth_bp.route('/register/<user_type>', methods=['POST'])
def register_post(user_type):
    if user_type not in ['recruiter', 'jobseeker']:
        flash('Invalid user type', 'error')
        return redirect(url_for('auth.choose_role'))
    
    if user_type == 'recruiter':
        form = RecruiterRegisterForm()
    else:
        form = JobSeekerRegisterForm()
    
    if form.validate_on_submit():
        # Check if user already exists
        existing_user = User.query.filter_by(email=form.email.data).first()
        if existing_user:
            flash('Email already registered', 'error')
            return render_template('auth/register.html', form=form, user_type=user_type)
        
        # Create user
        user = User(
            email=form.email.data,
            user_type=user_type,
            is_verified=True,  # Auto-verify for now, disable email verification
            verification_token=generate_verification_token()
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create profile
        if user_type == 'recruiter':
            profile = RecruiterProfile(
                user_id=user.id,
                full_name=form.full_name.data,
                company_name=form.company_name.data,
                location=form.location.data,
                position=form.position.data,
                mobile_number=form.mobile_number.data
            )
        else:
            profile = JobSeekerProfile(
                user_id=user.id,
                full_name=form.full_name.data,
                mobile_number=form.mobile_number.data,
                linkedin_id=form.linkedin_id.data,
                github_id=form.github_id.data
            )
        
        db.session.add(profile)
        db.session.commit()
        
        # Email verification disabled for now
        # if send_verification_email(user.email, user.verification_token):
        #     flash('Registration successful! Please check your email to verify your account.', 'success')
        # else:
        #     flash('Registration successful! However, we could not send verification email. Please contact support.', 'warning')
        
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('auth.login', user_type=user_type))
    
    return render_template('auth/register.html', form=form, user_type=user_type)

@auth_bp.route('/verify-email/<token>')
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()
    if user:
        user.is_verified = True
        user.verification_token = None
        db.session.commit()
        flash('Email verified successfully! You can now log in.', 'success')
    else:
        flash('Invalid verification token', 'error')
    
    return redirect(url_for('auth.choose_role'))

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('main.index'))

# Recruiter routes
@recruiter_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    recruiter = current_user.recruiter_profile
    jobs = recruiter.jobs.order_by(Job.created_at.desc()).limit(5).all()
    
    # Get statistics
    total_jobs = recruiter.jobs.count()
    active_jobs = recruiter.jobs.filter_by(status='active').count()
    total_applications = Application.query.join(Job).filter(Job.recruiter_id == recruiter.id).count()
    pending_applications = Application.query.join(Job).filter(
        Job.recruiter_id == recruiter.id,
        Application.status == 'pending'
    ).count()
    
    return render_template('recruiter/dashboard.html',
                         recruiter=recruiter,
                         jobs=jobs,
                         total_jobs=total_jobs,
                         active_jobs=active_jobs,
                         total_applications=total_applications,
                         pending_applications=pending_applications)

@recruiter_bp.route('/add-job')
@login_required
def add_job():
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    form = JobForm()
    return render_template('recruiter/add_job.html', form=form)

@recruiter_bp.route('/add-job', methods=['POST'])
@login_required
def add_job_post():
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    form = JobForm()
    if form.validate_on_submit():
        job = Job(
            recruiter_id=current_user.recruiter_profile.id,
            title=form.title.data,
            description=form.description.data,
            requirements=form.requirements.data,
            responsibilities=form.responsibilities.data,
            skills_needed=form.skills_needed.data,
            salary=form.salary.data,
            location=form.location.data,
            job_type=form.job_type.data,
            experience_level=form.experience_level.data,
            expiry_date=form.expiry_date.data
        )
        
        db.session.add(job)
        db.session.commit()
        
        flash('Job posted successfully!', 'success')
        return redirect(url_for('recruiter.manage_jobs'))
    
    return render_template('recruiter/add_job.html', form=form)

@recruiter_bp.route('/manage-jobs')
@login_required
def manage_jobs():
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    page = request.args.get('page', 1, type=int)
    jobs = current_user.recruiter_profile.jobs.order_by(Job.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    return render_template('recruiter/manage_jobs.html', jobs=jobs)

@recruiter_bp.route('/job/<int:job_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_job(job_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    job = Job.query.filter_by(id=job_id, recruiter_id=current_user.recruiter_profile.id).first_or_404()
    form = JobForm(obj=job)
    if form.validate_on_submit():
        job.title = form.title.data
        job.description = form.description.data
        job.requirements = form.requirements.data
        job.responsibilities = form.responsibilities.data
        job.skills_needed = form.skills_needed.data
        job.salary = form.salary.data
        job.location = form.location.data
        job.job_type = form.job_type.data
        job.experience_level = form.experience_level.data
        job.expiry_date = form.expiry_date.data
        db.session.commit()
        flash('Job updated successfully!', 'success')
        return redirect(url_for('recruiter.manage_jobs'))
    return render_template('recruiter/edit_job.html', form=form, job=job)

@recruiter_bp.route('/job/<int:job_id>/applications')
@login_required
def view_applications(job_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    job = Job.query.filter_by(id=job_id, recruiter_id=current_user.recruiter_profile.id).first_or_404()
    applications = job.applications.order_by(Application.applied_at.desc()).all()
    
    return render_template('recruiter/view_applications.html', job=job, applications=applications)

@recruiter_bp.route('/application/<int:app_id>/review')
@login_required
def review_application(app_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    application = Application.query.join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == current_user.recruiter_profile.id
    ).first_or_404()
    
    return render_template('recruiter/review_application.html', application=application)

@recruiter_bp.route('/application/<int:app_id>/approve')
@login_required
def approve_application(app_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    application = Application.query.join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == current_user.recruiter_profile.id
    ).first_or_404()
    
    application.status = 'approved'
    application.reviewed_at = datetime.utcnow()
    db.session.commit()
    
    flash('Application approved successfully!', 'success')
    return redirect(url_for('recruiter.generate_assessment', app_id=app_id))

@recruiter_bp.route('/application/<int:app_id>/reject')
@login_required
def reject_application(app_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    application = Application.query.join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == current_user.recruiter_profile.id
    ).first_or_404()
    
    application.status = 'rejected'
    application.reviewed_at = datetime.utcnow()
    db.session.commit()
    
    flash('Application rejected', 'info')
    return redirect(url_for('recruiter.view_applications', job_id=application.job_id))

@recruiter_bp.route('/application/<int:app_id>/generate-assessment')
@login_required
def generate_assessment(app_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    application = Application.query.join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == current_user.recruiter_profile.id,
        Application.status == 'approved'
    ).first_or_404()
    
    # Check if assessment already exists
    if application.assessment:
        return redirect(url_for('recruiter.edit_assessment', assessment_id=application.assessment.id))
    
    form = AssessmentForm()
    return render_template('recruiter/generate_assessment.html', application=application, form=form)

@recruiter_bp.route('/application/<int:app_id>/generate-assessment', methods=['POST'])
@login_required
def generate_assessment_post(app_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    application = Application.query.join(Job).filter(
        Application.id == app_id,
        Job.recruiter_id == current_user.recruiter_profile.id,
        Application.status == 'approved'
    ).first_or_404()
    form = AssessmentForm()
    if form.validate_on_submit():
        assessment = Assessment(
            application_id=application.id,
            title=form.title.data,
            instructions=form.instructions.data,
            duration_minutes=form.duration_minutes.data
        )
        db.session.add(assessment)
        db.session.flush()
        # Generate AI questions, ensuring no duplicates
        ai_questions = generate_ai_questions(
            application.job.description,
            application.job.skills_needed,
            application.job.requirements,
            num_questions=5,
            existing_questions=[]
        )
        for i, q_data in enumerate(ai_questions):
            question = Question(
                assessment_id=assessment.id,
                question_text=q_data['question'],
                question_type=q_data['type'],
                time_limit_minutes=q_data.get('time_limit', 5),
                order_number=i + 1
            )
            if q_data['type'] == 'mcq' and 'options' in q_data:
                question.options = json.dumps(q_data['options'])
                question.correct_answer = q_data.get('correct_answer', '')
            else:
                question.correct_answer = q_data.get('correct_answer', '')
            db.session.add(question)
        assessment.total_questions = len(ai_questions)
        db.session.commit()
        flash('Assessment generated and saved!', 'success')
        return redirect(url_for('recruiter.edit_assessment', assessment_id=assessment.id))
    return render_template('recruiter/generate_assessment.html', application=application, form=form)

@recruiter_bp.route('/assessment/<int:assessment_id>/edit')
@login_required
def edit_assessment(assessment_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    assessment = Assessment.query.join(Application).join(Job).filter(
        Assessment.id == assessment_id,
        Job.recruiter_id == current_user.recruiter_profile.id
    ).first_or_404()
    
    questions = assessment.questions.order_by(Question.order_number).all()
    return render_template('recruiter/edit_assessment.html', assessment=assessment, questions=questions)

@recruiter_bp.route('/assessment/<int:assessment_id>/publish')
@login_required
def publish_assessment(assessment_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    assessment = Assessment.query.join(Application).join(Job).filter(
        Assessment.id == assessment_id,
        Job.recruiter_id == current_user.recruiter_profile.id
    ).first_or_404()
    
    assessment.status = 'published'
    assessment.published_at = datetime.utcnow()
    db.session.commit()
    
    flash('Assessment published! Job seeker will be notified.', 'success')
    return redirect(url_for('recruiter.dashboard'))

# Job Seeker routes
@jobseeker_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    jobseeker = current_user.jobseeker_profile
    
    # Get recent jobs
    recent_jobs = Job.query.filter_by(status='active').filter(
        Job.expiry_date >= datetime.utcnow().date()
    ).order_by(Job.created_at.desc()).limit(5).all()
    
    # Get applications
    applications = jobseeker.applications.order_by(Application.applied_at.desc()).limit(5).all()
    
    # Get pending assessments
    pending_assessments = Assessment.query.join(Application).filter(
        Application.jobseeker_id == jobseeker.id,
        Assessment.status == 'published'
    ).all()
    
    return render_template('jobseeker/dashboard.html',
                         jobseeker=jobseeker,
                         recent_jobs=recent_jobs,
                         applications=applications,
                         pending_assessments=pending_assessments)

@jobseeker_bp.route('/profile')
@login_required
def profile():
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    form = ProfileForm(obj=current_user.jobseeker_profile)
    return render_template('jobseeker/profile.html', form=form)

@jobseeker_bp.route('/profile', methods=['POST'])
@login_required
def profile_post():
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    form = ProfileForm()
    if form.validate_on_submit():
        profile = current_user.jobseeker_profile
        
        profile.full_name = form.full_name.data
        profile.mobile_number = form.mobile_number.data
        profile.linkedin_id = form.linkedin_id.data
        profile.github_id = form.github_id.data
        profile.skills = form.skills.data
        profile.experience = form.experience.data
        profile.education = form.education.data
        
        # Handle resume upload
        if form.resume.data:
            filename = save_file(form.resume.data, current_app.config['UPLOAD_FOLDER'], 
                               prefix=f'resume_{current_user.id}')
            if filename:
                profile.resume_filename = filename
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('jobseeker.profile'))
    
    return render_template('jobseeker/profile.html', form=form)

@jobseeker_bp.route('/jobs')
@login_required
def browse_jobs():
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    job_type = request.args.get('job_type', '')
    location = request.args.get('location', '')
    
    query = Job.query.filter_by(status='active').filter(
        Job.expiry_date >= datetime.utcnow().date()
    )
    
    if search:
        query = query.filter(
            Job.title.contains(search) | 
            Job.description.contains(search) |
            Job.skills_needed.contains(search)
        )
    
    if job_type:
        query = query.filter_by(job_type=job_type)
    
    if location:
        query = query.filter(Job.location.contains(location))
    
    jobs = query.order_by(Job.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    return render_template('jobseeker/browse_jobs.html', jobs=jobs, 
                         search=search, job_type=job_type, location=location)

@jobseeker_bp.route('/job/<int:job_id>')
@login_required
def job_details(job_id):
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    job = Job.query.filter_by(id=job_id, status='active').first_or_404()
    
    # Check if already applied
    existing_application = Application.query.filter_by(
        job_id=job_id,
        jobseeker_id=current_user.jobseeker_profile.id
    ).first()
    
    return render_template('jobseeker/job_details.html', job=job, existing_application=existing_application)

@jobseeker_bp.route('/job/<int:job_id>/apply')
@login_required
def apply_job(job_id):
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    job = Job.query.filter_by(id=job_id, status='active').first_or_404()
    profile = current_user.jobseeker_profile
    
    # Check if profile is complete
    if not profile.resume_filename:
        flash('Please complete your profile and upload a resume before applying.', 'warning')
        return redirect(url_for('jobseeker.profile'))
    
    # Check if already applied
    existing_application = Application.query.filter_by(
        job_id=job_id,
        jobseeker_id=profile.id
    ).first()
    
    if existing_application:
        flash('You have already applied for this job.', 'info')
        return redirect(url_for('jobseeker.job_details', job_id=job_id))
    
    form = ApplicationForm()
    return render_template('jobseeker/apply_job.html', job=job, form=form)

@jobseeker_bp.route('/job/<int:job_id>/apply', methods=['POST'])
@login_required
def apply_job_post(job_id):
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    job = Job.query.filter_by(id=job_id, status='active').first_or_404()
    form = ApplicationForm()
    
    if form.validate_on_submit():
        application = Application(
            job_id=job_id,
            jobseeker_id=current_user.jobseeker_profile.id,
            cover_letter=form.cover_letter.data
        )
        
        db.session.add(application)
        db.session.commit()
        
        flash('Application submitted successfully!', 'success')
        return redirect(url_for('jobseeker.dashboard'))
    
    return render_template('jobseeker/apply_job.html', job=job, form=form)

@jobseeker_bp.route('/assessment/<int:assessment_id>')
@login_required
def take_assessment(assessment_id):
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    assessment = Assessment.query.join(Application).filter(
        Assessment.id == assessment_id,
        Application.jobseeker_id == current_user.jobseeker_profile.id,
        Assessment.status == 'published'
    ).first_or_404()
    
    # Check if already has submission
    submission = AssessmentSubmission.query.filter_by(assessment_id=assessment_id).first()
    if submission and submission.status == 'completed':
        return redirect(url_for('jobseeker.assessment_results', assessment_id=assessment_id))
    
    # Create new submission if not exists
    if not submission:
        submission = AssessmentSubmission(assessment_id=assessment_id)
        db.session.add(submission)
        db.session.commit()
    
    questions = assessment.questions.order_by(Question.order_number).all()
    
    # Convert questions to serializable format
    questions_data = []
    for q in questions:
        q_data = {
            'id': q.id,
            'question_text': q.question_text,
            'question_type': q.question_type,
            'options': json.loads(q.options) if q.options else [],
            'time_limit_minutes': q.time_limit_minutes,
            'order_number': q.order_number,
            'allow_copy_paste': q.allow_copy_paste,
            'allow_tab_switch': q.allow_tab_switch,
            'allow_minimize': q.allow_minimize,
            'require_webcam': q.require_webcam
        }
        questions_data.append(q_data)
    
    return render_template('jobseeker/take_assessment.html', 
                         assessment=assessment, 
                         submission=submission,
                         questions=questions_data)

@jobseeker_bp.route('/assessment/<int:assessment_id>/results')
@login_required
def assessment_results(assessment_id):
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    assessment = Assessment.query.join(Application).filter(
        Assessment.id == assessment_id,
        Application.jobseeker_id == current_user.jobseeker_profile.id
    ).first_or_404()
    
    submission = AssessmentSubmission.query.filter_by(assessment_id=assessment_id).first_or_404()
    
    # Get project tasks if any
    project_tasks = ProjectTask.query.filter_by(assessment_id=assessment_id).all()
    
    return render_template('jobseeker/assessment_results.html', 
                         assessment=assessment, 
                         submission=submission,
                         project_tasks=project_tasks)

@jobseeker_bp.route('/project/<int:project_id>/submit', methods=['GET', 'POST'])
@login_required
def submit_project(project_id):
    if current_user.user_type != 'jobseeker':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    project = ProjectTask.query.join(Assessment).join(Application).filter(
        ProjectTask.id == project_id,
        Application.jobseeker_id == current_user.jobseeker_profile.id
    ).first_or_404()
    
    if request.method == 'POST':
        if 'project_file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        
        file = request.files['project_file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        if file and file.filename.endswith('.zip'):
            filename = secure_filename(f"project_{project_id}_{current_user.id}_{file.filename}")
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Save project submission
            submission = ProjectSubmission(
                project_task_id=project_id,
                file_path=filename,
                notes=request.form.get('notes', '')
            )
            db.session.add(submission)
            db.session.commit()
            
            flash('Project submitted successfully!', 'success')
            return redirect(url_for('jobseeker.assessment_results', assessment_id=project.assessment_id))
        else:
            flash('Please upload a ZIP file', 'error')
    
    return render_template('jobseeker/submit_project.html', project=project)

# API routes for assessment
@jobseeker_bp.route('/api/assessment/<int:assessment_id>/submit-answer', methods=['POST'])
@login_required
def submit_answer(assessment_id):
    if current_user.user_type != 'jobseeker':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    question_id = data.get('question_id')
    answer_text = data.get('answer_text', '')
    code_answer = data.get('code_answer', '')
    code_language = data.get('code_language', '')
    
    # Verify assessment belongs to user
    assessment = Assessment.query.join(Application).filter(
        Assessment.id == assessment_id,
        Application.jobseeker_id == current_user.jobseeker_profile.id
    ).first()
    
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404
    
    submission = AssessmentSubmission.query.filter_by(assessment_id=assessment_id).first()
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    
    # Create or update answer
    answer = Answer.query.filter_by(
        submission_id=submission.id,
        question_id=question_id
    ).first()
    
    if not answer:
        answer = Answer(
            submission_id=submission.id,
            question_id=question_id
        )
        db.session.add(answer)
    
    answer.answer_text = answer_text
    answer.code_answer = code_answer
    answer.code_language = code_language
    
    # Execute code if provided
    if code_answer and code_language:
        try:
            # Simple code execution for basic languages
            if code_language == 'python':
                # Note: In production, use a sandboxed environment like CodeJail
                import subprocess
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                    f.write(code_answer)
                    temp_file = f.name
                
                try:
                    result = subprocess.run(['python3', temp_file], 
                                          capture_output=True, text=True, timeout=5)
                    answer.code_output = result.stdout + result.stderr
                except subprocess.TimeoutExpired:
                    answer.code_output = "Code execution timed out"
                except Exception as e:
                    answer.code_output = f"Execution error: {str(e)}"
                finally:
                    os.unlink(temp_file)
            elif code_language == 'javascript':
                # Simple Node.js execution
                with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                    f.write(code_answer)
                    temp_file = f.name
                
                try:
                    result = subprocess.run(['node', temp_file], 
                                          capture_output=True, text=True, timeout=5)
                    answer.code_output = result.stdout + result.stderr
                except subprocess.TimeoutExpired:
                    answer.code_output = "Code execution timed out"
                except Exception as e:
                    answer.code_output = f"Execution error: {str(e)}"
                finally:
                    os.unlink(temp_file)
            elif code_language == 'java':
                # Simple Java execution (requires javac and java)
                with tempfile.NamedTemporaryFile(mode='w', suffix='.java', delete=False) as f:
                    # Extract class name from code
                    import re
                    class_match = re.search(r'public\s+class\s+(\w+)', code_answer)
                    class_name = class_match.group(1) if class_match else 'Main'
                    
                    f.write(code_answer)
                    temp_file = f.name
                
                try:
                    # Compile
                    compile_result = subprocess.run(['javac', temp_file], 
                                                  capture_output=True, text=True, timeout=10)
                    if compile_result.returncode == 0:
                        # Run
                        run_result = subprocess.run(['java', '-cp', os.path.dirname(temp_file), class_name], 
                                                  capture_output=True, text=True, timeout=5)
                        answer.code_output = run_result.stdout + run_result.stderr
                    else:
                        answer.code_output = f"Compilation error: {compile_result.stderr}"
                except Exception as e:
                    answer.code_output = f"Execution error: {str(e)}"
                finally:
                    os.unlink(temp_file)
                    # Clean up class file
                    class_file = temp_file.replace('.java', '.class')
                    if os.path.exists(class_file):
                        os.unlink(class_file)
            else:
                answer.code_output = f"Code execution not supported for {code_language}"
        except Exception as e:
            answer.code_output = f"Error executing code: {str(e)}"
    
    db.session.commit()
    
    return jsonify({'success': True, 'output': answer.code_output})

@jobseeker_bp.route('/api/assessment/<int:assessment_id>/complete', methods=['POST'])
@login_required
def complete_assessment(assessment_id):
    if current_user.user_type != 'jobseeker':
        return jsonify({'error': 'Access denied'}), 403
    
    submission = AssessmentSubmission.query.filter_by(assessment_id=assessment_id).first()
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    
    submission.status = 'completed'
    submission.submitted_at = datetime.utcnow()
    
    # Calculate score
    assessment = Assessment.query.get(assessment_id)
    questions = assessment.questions.all()
    answers = submission.answers.all()
    
    total_score, max_score = calculate_assessment_score(answers, questions)
    submission.total_score = total_score
    submission.max_score = max_score
    
    db.session.commit()
    
    return jsonify({'success': True, 'score': total_score, 'max_score': max_score})

# File serving
@main_bp.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# Project Task Management
@recruiter_bp.route('/assessment/<int:assessment_id>/add-project', methods=['GET', 'POST'])
@login_required
def add_project_task(assessment_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    
    assessment = Assessment.query.join(Application).join(Job).filter(
        Assessment.id == assessment_id,
        Job.recruiter_id == current_user.recruiter_profile.id
    ).first_or_404()
    
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        requirements = request.form.get('requirements')
        deadline_hours = int(request.form.get('deadline_hours', 72))
        
        project_task = ProjectTask(
            assessment_id=assessment_id,
            title=title,
            description=description,
            requirements=requirements,
            deadline_hours=deadline_hours
        )
        
        db.session.add(project_task)
        db.session.commit()
        
        flash('Project task added successfully!', 'success')
        return redirect(url_for('recruiter.view_assessment', assessment_id=assessment_id))
    
    return render_template('recruiter/add_project_task.html', assessment=assessment)

@recruiter_bp.route('/api/question/<int:question_id>/regenerate', methods=['POST'])
@login_required
def regenerate_question(question_id):
    question = Question.query.get_or_404(question_id)
    assessment = Assessment.query.get(question.assessment_id)
    application = Application.query.get(assessment.application_id)
    job = Job.query.get(application.job_id)
    if current_user.user_type != 'recruiter' or job.recruiter_id != current_user.recruiter_profile.id:
        return jsonify({'error': 'Access denied'}), 403
    # Get all existing questions except the one being regenerated
    existing_questions = [
        {'question': q.question_text}
        for q in assessment.questions if q.id != question.id
    ]
    # Generate a new question using AI, ensuring uniqueness
    ai_questions = generate_ai_questions(
        job.description,
        job.skills_needed,
        job.requirements,
        num_questions=1,
        existing_questions=existing_questions
    )
    if not ai_questions:
        return jsonify({'error': 'AI failed to generate question'}), 500
    q_data = ai_questions[0]
    question.question_text = q_data['question']
    question.question_type = q_data['type']
    question.time_limit_minutes = q_data.get('time_limit', 5)
    if q_data['type'] == 'mcq' and 'options' in q_data:
        question.options = json.dumps(q_data['options'])
        question.correct_answer = q_data.get('correct_answer', '')
    else:
        question.options = None
        question.correct_answer = q_data.get('correct_answer', '')
    db.session.commit()
    return jsonify({'success': True, 'question': {
        'id': question.id,
        'question_text': question.question_text,
        'question_type': question.question_type,
        'options': json.loads(question.options) if question.options else [],
        'time_limit_minutes': question.time_limit_minutes,
        'order_number': question.order_number,
        'allow_copy_paste': question.allow_copy_paste,
        'allow_tab_switch': question.allow_tab_switch,
        'allow_minimize': question.allow_minimize,
        'require_webcam': question.require_webcam
    }})

@recruiter_bp.route('/api/question/<int:question_id>/edit', methods=['POST'])
@login_required
def edit_question(question_id):
    question = Question.query.get_or_404(question_id)
    assessment = Assessment.query.get(question.assessment_id)
    application = Application.query.get(assessment.application_id)
    job = Job.query.get(application.job_id)
    if current_user.user_type != 'recruiter' or job.recruiter_id != current_user.recruiter_profile.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    question.question_text = data.get('question_text', question.question_text)
    question.question_type = data.get('question_type', question.question_type)
    question.time_limit_minutes = data.get('time_limit_minutes', question.time_limit_minutes)
    question.allow_copy_paste = data.get('allow_copy_paste', question.allow_copy_paste)
    question.allow_tab_switch = data.get('allow_tab_switch', question.allow_tab_switch)
    question.allow_minimize = data.get('allow_minimize', question.allow_minimize)
    question.require_webcam = data.get('require_webcam', question.require_webcam)
    if question.question_type == 'mcq':
        options = data.get('options', [])
        question.options = json.dumps(options)
        question.correct_answer = data.get('correct_answer', question.correct_answer)
    else:
        question.options = None
        question.correct_answer = data.get('correct_answer', question.correct_answer)
    db.session.commit()
    return jsonify({'success': True, 'question': {
        'id': question.id,
        'question_text': question.question_text,
        'question_type': question.question_type,
        'options': json.loads(question.options) if question.options else [],
        'time_limit_minutes': question.time_limit_minutes,
        'order_number': question.order_number,
        'allow_copy_paste': question.allow_copy_paste,
        'allow_tab_switch': question.allow_tab_switch,
        'allow_minimize': question.allow_minimize,
        'require_webcam': question.require_webcam,
        'correct_answer': question.correct_answer
    }})

@recruiter_bp.route('/project-feedback/<int:submission_id>', methods=['POST'])
@login_required
def project_feedback(submission_id):
    if current_user.user_type != 'recruiter':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    from models import ProjectSubmission
    submission = ProjectSubmission.query.get_or_404(submission_id)
    feedback = request.form.get('feedback', '').strip()
    score = request.form.get('score', '').strip()
    try:
        submission.feedback = feedback
        submission.score = float(score) if score else None
        db.session.commit()
        flash('Feedback and score saved.', 'success')
    except Exception as e:
        db.session.rollback()
        flash('Failed to save feedback/score.', 'error')
    return redirect(request.referrer or url_for('recruiter.dashboard'))

@admin_bp.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if not hasattr(current_user, 'user_type') or current_user.user_type != 'admin':
        flash('Access denied', 'error')
        return redirect(url_for('main.index'))
    from models import User, Job, Application, Assessment, ProjectTask, ProjectSubmission
    total_users = User.query.count()
    total_jobs = Job.query.count()
    total_applications = Application.query.count()
    total_assessments = Assessment.query.count()
    total_projects = ProjectTask.query.count()
    total_project_submissions = ProjectSubmission.query.count()
    return render_template('admin/dashboard.html',
        total_users=total_users,
        total_jobs=total_jobs,
        total_applications=total_applications,
        total_assessments=total_assessments,
        total_projects=total_projects,
        total_project_submissions=total_project_submissions)
