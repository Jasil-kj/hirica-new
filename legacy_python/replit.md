# Hirica - AI-Powered Job Assessment Platform

## Overview

Hirica is a comprehensive web-based job assessment platform that connects recruiters with job seekers through AI-generated assessments. The platform allows recruiters to post jobs, review applications, and create intelligent assessments to evaluate candidates. Job seekers can browse opportunities, apply for positions, and demonstrate their skills through tailored assessments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database**: SQLAlchemy ORM with configurable database support (SQLite default, PostgreSQL ready)
- **Authentication**: Flask-Login for user session management
- **Email Service**: Flask-Mail for email notifications and verification
- **File Handling**: Werkzeug for secure file uploads
- **AI Integration**: Groq API for generating assessment questions

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive design
- **CSS Framework**: Custom dark-theme styles with dual-theme support
- **JavaScript**: Vanilla JS with CodeMirror for code editing interface
- **Theme System**: Dark/light mode toggle with localStorage persistence

## Key Components

### User Management
- Two-tier user system: Recruiters and Job Seekers
- Email verification system with token-based authentication
- Profile management with file upload capabilities
- Role-based access control and dashboard routing

### Job Management
- Job posting with comprehensive details (title, description, requirements, skills)
- Job expiration system with automatic status updates
- Application tracking and management
- Search and filtering capabilities for job browsing

### Assessment System
- AI-powered question generation using job requirements
- Multiple question types including coding challenges
- Built-in code editor with syntax highlighting and execution
- Time-limited assessments with progress tracking
- Automated scoring and results generation

### File Management
- Resume upload and storage system
- Project submission handling (ZIP files)
- Secure file serving with access control
- File type validation and size limits

## Data Flow

1. **Registration Flow**: User selects role → Completes registration → Email verification → Dashboard access
2. **Job Application Flow**: Job seeker browses jobs → Applies with cover letter → Recruiter reviews → Assessment generation
3. **Assessment Flow**: Recruiter creates assessment → AI generates questions → Job seeker takes test → Results calculated → Both parties receive feedback
4. **Communication Flow**: Email notifications for key events → Dashboard updates → Status tracking

## External Dependencies

### Third-Party Services
- **Groq API**: AI question generation and assessment creation
- **SMTP Email Service**: Email notifications and verification
- **Bootstrap CDN**: Frontend styling and components
- **FontAwesome**: Icons and UI elements
- **CodeMirror**: Code editing interface

### Python Libraries
- Flask ecosystem (SQLAlchemy, Login, Mail, WTF)
- Werkzeug for utilities and security
- Password hashing and security utilities

## Deployment Strategy

### Configuration Management
- Environment-based configuration using environment variables
- Database URL configuration for different environments
- Email service configuration with fallback defaults
- Session secret and API key management

### Security Measures
- Password hashing using Werkzeug security
- CSRF protection through Flask-WTF
- File upload validation and sanitization
- Proxy fix for deployment behind reverse proxies

### Scalability Considerations
- Database connection pooling with SQLAlchemy
- File upload size limits and storage management
- Session-based user management
- Prepared for horizontal scaling with external database

The application follows a modular blueprint structure for maintainability and includes comprehensive form validation, error handling, and user feedback systems. The AI assessment feature is the core differentiator, providing intelligent evaluation tools that adapt to specific job requirements.