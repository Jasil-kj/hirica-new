import os
import secrets
import json
import requests
from datetime import datetime, timedelta
from flask import current_app, url_for
from flask_mail import Message
from werkzeug.utils import secure_filename
import re

def generate_verification_token():
    """Generate a random verification token"""
    return secrets.token_urlsafe(32)

def send_verification_email(user_email, token):
    """Send verification email to user"""
    try:
        from app import mail
        verification_url = url_for('auth.verify_email', token=token, _external=True)
        msg = Message(
            subject='Verify Your Hirica Account',
            recipients=[user_email],
            html=f'''
            <h2>Welcome to Hirica!</h2>
            <p>Please click the link below to verify your email address:</p>
            <a href="{verification_url}" style="background-color: #000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
            <p>If you didn't create an account, please ignore this email.</p>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email: {str(e)}")
        return False

def allowed_file(filename, allowed_extensions):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def save_file(file, upload_folder, prefix=''):
    """Save uploaded file and return filename"""
    if file and allowed_file(file.filename, {'pdf', 'doc', 'docx', 'zip'}):
        filename = secure_filename(file.filename)
        if prefix:
            filename = f"{prefix}_{filename}"
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        return filename
    return None

def is_question_about_skill(question_text, skill):
    # Simple check: does the skill appear as a word in the question?
    return re.search(rf'\b{re.escape(skill)}\b', question_text, re.IGNORECASE) is not None

def is_duplicate_question(question_text, existing_questions):
    return any(q['question'].strip().lower() == question_text.strip().lower() for q in existing_questions)

def generate_ai_questions(job_description, skills, requirements, num_questions=5, existing_questions=None):
    """Generate assessment questions using Groq AI, ensuring at least one per skill, no duplicates, and no out-of-syllabus questions."""
    if existing_questions is None:
        existing_questions = []
    try:
        api_key = current_app.config.get('GROQ_API_KEY')
        skills_list = [s.strip() for s in skills.split(',') if s.strip()]
        all_questions = []
        for skill in skills_list:
            # Prompt for one question about this skill only
            prompt = f"""
            Generate 1 technical assessment question for a job with the following details:
            Job Description: {job_description}
            Required Skill: {skill}
            Requirements: {requirements}
            The question must be strictly about the skill '{skill}' and not about unrelated topics. Do not repeat questions. Do not ask out-of-syllabus questions. Return JSON as before.
            """
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            data = {
                'model': 'mixtral-8x7b-32768',
                'messages': [
                    {'role': 'system', 'content': 'You are an expert technical recruiter who creates high-quality assessment questions.'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': 0.7,
                'max_tokens': 1024
            }
            response = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers=headers,
                json=data,
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                try:
                    questions_data = json.loads(content)
                    for q in questions_data.get('questions', []):
                        if is_duplicate_question(q['question'], all_questions + existing_questions):
                            continue
                        if not is_question_about_skill(q['question'], skill):
                            continue
                        all_questions.append(q)
                except json.JSONDecodeError:
                    continue
        # If more questions are needed, fill up to num_questions with additional relevant questions
        if len(all_questions) < num_questions:
            extra_needed = num_questions - len(all_questions)
            extra_questions = generate_sample_questions(skills, extra_needed)
            for q in extra_questions:
                if not is_duplicate_question(q['question'], all_questions + existing_questions):
                    all_questions.append(q)
                if len(all_questions) >= num_questions:
                    break
        return all_questions[:num_questions]
    except Exception as e:
        current_app.logger.error(f"Error generating AI questions: {str(e)}")
        return generate_sample_questions(skills, num_questions)

def generate_sample_questions(skills, num_questions=5):
    """Generate sample questions when AI is not available"""
    skills_list = [skill.strip().lower() for skill in skills.split(',')]
    
    sample_questions = []
    
    # General programming questions
    sample_questions.extend([
        {
            "type": "mcq",
            "question": "What is the time complexity of binary search?",
            "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            "correct_answer": "O(log n)",
            "time_limit": 3,
            "difficulty": "medium"
        },
        {
            "type": "descriptive",
            "question": "Explain the difference between procedural and object-oriented programming.",
            "correct_answer": "Procedural programming focuses on functions and procedures, while OOP focuses on objects and classes with encapsulation, inheritance, and polymorphism.",
            "time_limit": 8,
            "difficulty": "medium"
        }
    ])
    
    # Python questions
    if any('python' in skill for skill in skills_list):
        sample_questions.extend([
            {
                "type": "mcq",
                "question": "Which of the following is used to define a function in Python?",
                "options": ["function", "def", "define", "func"],
                "correct_answer": "def",
                "time_limit": 3,
                "difficulty": "easy"
            },
            {
                "type": "coding",
                "question": "Write a Python function to find the factorial of a number.",
                "correct_answer": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)",
                "time_limit": 10,
                "difficulty": "medium"
            }
        ])
    
    # JavaScript questions
    if any('javascript' in skill or 'js' in skill for skill in skills_list):
        sample_questions.extend([
            {
                "type": "mcq",
                "question": "Which method is used to add an element to the end of an array in JavaScript?",
                "options": ["append()", "push()", "add()", "insert()"],
                "correct_answer": "push()",
                "time_limit": 3,
                "difficulty": "easy"
            },
            {
                "type": "coding",
                "question": "Write a JavaScript function to reverse a string.",
                "correct_answer": "function reverseString(str) {\n    return str.split('').reverse().join('');\n}",
                "time_limit": 8,
                "difficulty": "medium"
            }
        ])
    
    # General programming questions
    sample_questions.extend([
        {
            "type": "descriptive",
            "question": "Explain the difference between a stack and a queue data structure.",
            "correct_answer": "Stack follows LIFO (Last In First Out) principle, while queue follows FIFO (First In First Out) principle.",
            "time_limit": 15,
            "difficulty": "medium"
        },
        {
            "type": "mcq",
            "question": "What does API stand for?",
            "options": ["Application Programming Interface", "Advanced Programming Interface", "Application Process Interface", "Advanced Process Interface"],
            "correct_answer": "Application Programming Interface",
            "time_limit": 2,
            "difficulty": "easy"
        },
        {
            "type": "descriptive",
            "question": "Describe the benefits of version control systems like Git.",
            "correct_answer": "Version control systems track changes, enable collaboration, provide backup, allow branching and merging, and maintain project history.",
            "time_limit": 12,
            "difficulty": "medium"
        }
    ])
    
    # Return random selection of questions
    import random
    random.shuffle(sample_questions)
    return sample_questions[:num_questions]

def execute_code(code, language):
    """Execute code in multiple languages using the Piston API."""
    try:
        # Map frontend language names to Piston API names
        lang_map = {
            'python': 'python3',
            'javascript': 'javascript',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'csharp': 'csharp',
            'php': 'php',
            'ruby': 'ruby',
            'go': 'go',
            'rust': 'rust',
            'kotlin': 'kotlin',
            'swift': 'swift',
            'typescript': 'typescript',
            'scala': 'scala',
            'r': 'r',
            'perl': 'perl',
            'lua': 'lua',
            'dart': 'dart',
            'sql': 'sql',
        }
        piston_lang = lang_map.get(language.lower())
        if not piston_lang:
            return {
                'success': False,
                'output': None,
                'error': f'Language {language} not supported for execution'
            }
        payload = {
            'language': piston_lang,
            'source': code
        }
        response = requests.post('https://emkc.org/api/v2/piston/execute', json=payload, timeout=20)
        if response.status_code == 200:
            result = response.json()
            return {
                'success': True,
                'output': result.get('output', ''),
                'error': None
            }
        else:
            return {
                'success': False,
                'output': None,
                'error': f'Execution API error: {response.status_code}'
            }
    except Exception as e:
        return {
            'success': False,
            'output': None,
            'error': str(e)
        }

def calculate_assessment_score(answers, questions):
    """Calculate assessment score based on answers"""
    total_score = 0
    max_score = len(questions)
    
    for answer in answers:
        question = next((q for q in questions if q.id == answer.question_id), None)
        if question:
            if question.question_type == 'mcq':
                if answer.answer_text and answer.answer_text.strip().lower() == question.correct_answer.strip().lower():
                    total_score += 1
            elif question.question_type == 'coding':
                # For coding questions, we could implement more sophisticated scoring
                # For now, give partial credit if code is provided
                if answer.code_answer:
                    total_score += 0.5  # Partial credit
            elif question.question_type == 'descriptive':
                # For descriptive questions, manual review would be needed
                # For now, give partial credit if answer is provided
                if answer.answer_text and len(answer.answer_text.strip()) > 20:
                    total_score += 0.7  # Partial credit
    
    return total_score, max_score

def format_datetime(dt):
    """Format datetime for display"""
    if dt:
        return dt.strftime('%B %d, %Y at %I:%M %p')
    return 'N/A'

def time_ago(dt):
    """Get human-readable time difference"""
    if not dt:
        return 'N/A'
    
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"

def get_project_due_at(project):
    """Return the due datetime for a project task."""
    return project.created_at + timedelta(hours=project.deadline_hours)

def get_project_time_remaining(project):
    """Return time remaining as timedelta (can be negative if overdue)."""
    due_at = get_project_due_at(project)
    return due_at - datetime.utcnow()

def send_project_deadline_reminder(user_email, project, hours_left):
    """Send a reminder email about an upcoming or overdue project deadline."""
    try:
        from app import mail
        due_at = get_project_due_at(project)
        due_str = due_at.strftime('%B %d, %Y at %I:%M %p UTC')
        msg = Message(
            subject='[Hirica] Project Submission Reminder',
            recipients=[user_email],
            html=f'''
            <h2>Project Submission Reminder</h2>
            <p>This is a reminder that your project <b>{project.title}</b> is due in <b>{hours_left} hours</b>.</p>
            <p>Deadline: <b>{due_str}</b></p>
            <p>Please make sure to submit your project before the deadline.</p>
            <p>If you have already submitted, you can ignore this message.</p>
            '''
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send project deadline reminder: {str(e)}")
        return False
