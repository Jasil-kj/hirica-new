// Assessment Interface JavaScript

class AssessmentManager {
    constructor(assessmentData) {
        this.data = assessmentData;
        this.currentQuestion = 0;
        this.answers = {};
        this.violations = [];
        this.timers = {
            total: null,
            question: null
        };
        this.startTime = null;
        this.questionStartTime = null;
        this.isStarted = false;
        this.isCompleted = false;
        
        this.bindEvents();
        this.initializeProctoring();
    }

    bindEvents() {
        // Start assessment button
        const startButton = document.getElementById('startAssessment');
        if (startButton) {
            startButton.addEventListener('click', () => this.startAssessment());
        }

        // Prevent common violations
        this.preventViolations();
        
        // Handle page unload
        window.addEventListener('beforeunload', (e) => {
            if (this.isStarted && !this.isCompleted) {
                e.preventDefault();
                e.returnValue = 'You have an ongoing assessment. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (this.isStarted && !this.isCompleted && document.hidden) {
                this.recordViolation('tab_switch', 'Switched to another tab or minimized window');
            }
        });
    }

    preventViolations() {
        // Disable right-click context menu
        document.addEventListener('contextmenu', (e) => {
            if (this.isStarted && !this.isCompleted) {
                e.preventDefault();
                this.recordViolation('right_click', 'Attempted to open context menu');
            }
        });

        // Disable certain keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isStarted || this.isCompleted) return;

            const currentQuestionData = this.getCurrentQuestionData();
            if (!currentQuestionData) return;

            // Check if copy-paste is allowed for current question
            if (!currentQuestionData.allow_copy_paste) {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                    e.preventDefault();
                    this.recordViolation('copy_paste', `Attempted to ${e.key === 'c' ? 'copy' : e.key === 'v' ? 'paste' : 'cut'}`);
                }
            }

            // Disable developer tools shortcuts
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                this.recordViolation('dev_tools', 'Attempted to open developer tools');
            }

            // Disable refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.recordViolation('refresh', 'Attempted to refresh page');
            }
        });

        // Disable text selection for certain questions
        document.addEventListener('selectstart', (e) => {
            if (!this.isStarted || this.isCompleted) return;

            const currentQuestionData = this.getCurrentQuestionData();
            if (currentQuestionData && !currentQuestionData.allow_copy_paste) {
                const target = e.target;
                if (target.closest('.question-text') || target.closest('.mcq-options')) {
                    e.preventDefault();
                }
            }
        });
    }

    initializeProctoring() {
        // Initialize webcam if required
        this.checkWebcamRequirement();
        
        // Monitor screen recording
        this.monitorScreenRecording();
    }

    async checkWebcamRequirement() {
        const hasWebcamRequired = this.data.questions.some(q => q.require_webcam);
        
        if (hasWebcamRequired) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                this.webcamStream = stream;
                
                // Create webcam monitor element
                const webcamMonitor = document.createElement('div');
                webcamMonitor.id = 'webcamMonitor';
                webcamMonitor.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    width: 150px;
                    height: 100px;
                    background: #000;
                    border: 2px solid #28a745;
                    border-radius: 8px;
                    z-index: 1000;
                    display: none;
                `;
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.muted = true;
                video.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 6px;';
                
                webcamMonitor.appendChild(video);
                document.body.appendChild(webcamMonitor);
                
            } catch (error) {
                console.error('Webcam access denied:', error);
                window.notifications.error('Webcam access is required for this assessment');
            }
        }
    }

    monitorScreenRecording() {
        // Detect if screen is being recorded (basic detection)
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
            navigator.mediaDevices.getDisplayMedia = (...args) => {
                this.recordViolation('screen_recording', 'Screen recording detected');
                return originalGetDisplayMedia.apply(navigator.mediaDevices, args);
            };
        }
    }

    startAssessment() {
        this.isStarted = true;
        this.startTime = new Date();
        
        // Hide instructions and show question content
        document.getElementById('instructionsPanel').style.display = 'none';
        document.getElementById('questionContent').style.display = 'block';
        document.getElementById('questionNav').style.display = 'block';
        
        // Show webcam monitor if required
        const webcamMonitor = document.getElementById('webcamMonitor');
        if (webcamMonitor) {
            webcamMonitor.style.display = 'block';
        }
        
        // Start total timer
        this.startTotalTimer();
        
        // Show first question
        this.showQuestion(1);
        
        window.notifications.success('Assessment started. Good luck!');
    }

    showQuestion(questionNumber) {
        // Hide all questions
        const questions = document.querySelectorAll('.question-item');
        questions.forEach(q => q.style.display = 'none');
        
        // Show current question
        const currentQuestionEl = document.getElementById(`question-${questionNumber}`);
        if (currentQuestionEl) {
            currentQuestionEl.style.display = 'block';
            this.currentQuestion = questionNumber;
            
            // Update progress
            this.updateProgress();
            
            // Start question timer
            this.startQuestionTimer();
            
            // Update navigation
            this.updateNavigation();
            
            // Initialize code editor if needed
            this.initializeCodeEditor(questionNumber);
            
            // Check webcam requirement for this question
            this.checkQuestionWebcamRequirement();
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    }

    initializeCodeEditor(questionNumber) {
        const codeTextarea = document.getElementById(`code_${this.getCurrentQuestionId()}`);
        if (codeTextarea && !codeTextarea.classList.contains('codemirror-initialized')) {
            window.initializeCodeEditor(codeTextarea, this.getCurrentQuestionId());
            codeTextarea.classList.add('codemirror-initialized');
        }
    }

    checkQuestionWebcamRequirement() {
        const currentQuestionData = this.getCurrentQuestionData();
        const webcamMonitor = document.getElementById('webcamMonitor');
        
        if (webcamMonitor) {
            if (currentQuestionData && currentQuestionData.require_webcam) {
                webcamMonitor.style.display = 'block';
                webcamMonitor.style.borderColor = '#28a745';
            } else {
                webcamMonitor.style.borderColor = '#6c757d';
            }
        }
    }

    startTotalTimer() {
        let totalSeconds = 0;
        this.timers.total = setInterval(() => {
            totalSeconds++;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            const totalTimerEl = document.getElementById('totalTimer');
            if (totalTimerEl) {
                totalTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    startQuestionTimer() {
        if (this.timers.question) {
            clearInterval(this.timers.question);
        }

        const currentQuestionData = this.getCurrentQuestionData();
        if (!currentQuestionData) return;

        this.questionStartTime = new Date();
        let remainingSeconds = currentQuestionData.time_limit_minutes * 60;

        this.timers.question = setInterval(() => {
            remainingSeconds--;
            
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            
            const questionTimerEl = document.getElementById('questionTimer');
            if (questionTimerEl) {
                questionTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Change color when time is running out
                if (remainingSeconds <= 60) {
                    questionTimerEl.style.color = '#dc3545';
                } else if (remainingSeconds <= 300) {
                    questionTimerEl.style.color = '#ffc107';
                } else {
                    questionTimerEl.style.color = '#fff';
                }
            }

            if (remainingSeconds <= 0) {
                clearInterval(this.timers.question);
                this.timeoutQuestion();
            }
        }, 1000);
    }

    timeoutQuestion() {
        window.notifications.warning('Time\'s up for this question!');
        
        // Auto-save current answer
        this.saveCurrentAnswer();
        
        // Move to next question or complete assessment
        if (this.currentQuestion < this.data.questions.length) {
            setTimeout(() => {
                this.nextQuestion(this.currentQuestion, this.getCurrentQuestionId());
            }, 2000);
        } else {
            setTimeout(() => {
                this.completeAssessment();
            }, 2000);
        }
    }

    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const currentQuestionEl = document.getElementById('currentQuestion');
        
        if (progressBar && currentQuestionEl) {
            const progress = (this.currentQuestion / this.data.questions.length) * 100;
            progressBar.style.width = `${progress}%`;
            currentQuestionEl.textContent = this.currentQuestion;
        }
    }

    updateNavigation() {
        // Update navigation indicators
        const navItems = document.querySelectorAll('.question-nav-item');
        navItems.forEach((item, index) => {
            const questionNum = index + 1;
            item.classList.remove('current', 'completed');
            
            if (questionNum === this.currentQuestion) {
                item.classList.add('current');
                item.querySelector('.question-status').innerHTML = '<i class="fas fa-play text-primary"></i>';
            } else if (questionNum < this.currentQuestion) {
                item.classList.add('completed');
                item.querySelector('.question-status').innerHTML = '<i class="fas fa-check text-success"></i>';
            } else {
                item.querySelector('.question-status').innerHTML = '<i class="fas fa-clock text-muted"></i>';
            }
        });
    }

    getCurrentQuestionData() {
        return this.data.questions[this.currentQuestion - 1];
    }

    getCurrentQuestionId() {
        const questionData = this.getCurrentQuestionData();
        return questionData ? questionData.id : null;
    }

    saveCurrentAnswer() {
        const questionId = this.getCurrentQuestionId();
        const questionData = this.getCurrentQuestionData();
        
        if (!questionId || !questionData) return;

        let answerData = {
            question_id: questionId,
            time_taken: this.getQuestionTimeSpent()
        };

        if (questionData.question_type === 'mcq') {
            const selectedOption = document.querySelector(`input[name="answer_${questionId}"]:checked`);
            answerData.answer_text = selectedOption ? selectedOption.value : '';
        } else if (questionData.question_type === 'coding') {
            const codeElement = document.getElementById(`code_${questionId}`);
            const languageElement = document.getElementById(`language_${questionId}`);
            
            answerData.code_answer = codeElement ? codeElement.value : '';
            answerData.code_language = languageElement ? languageElement.value : '';
            
            // Get code output if available
            const outputElement = document.getElementById(`output_${questionId}`);
            if (outputElement) {
                answerData.code_output = outputElement.textContent;
            }
        } else if (questionData.question_type === 'descriptive') {
            const answerElement = document.getElementById(`answer_${questionId}`);
            answerData.answer_text = answerElement ? answerElement.value : '';
        }

        // Store answer locally
        this.answers[questionId] = answerData;

        // Send to server
        this.submitAnswer(answerData);
    }

    async submitAnswer(answerData) {
        try {
            const response = await fetch(`/jobseeker/api/assessment/${this.data.assessmentId}/submit-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(answerData)
            });

            if (!response.ok) {
                throw new Error('Failed to save answer');
            }

            console.log('Answer saved successfully');
        } catch (error) {
            console.error('Error saving answer:', error);
            window.notifications.error('Failed to save answer. Please try again.');
        }
    }

    getQuestionTimeSpent() {
        if (!this.questionStartTime) return 0;
        return Math.floor((new Date() - this.questionStartTime) / 1000);
    }

    recordViolation(type, description) {
        const violation = {
            type: type,
            description: description,
            timestamp: new Date().toISOString(),
            question_id: this.getCurrentQuestionId()
        };

        this.violations.push(violation);

        // Show violation warning
        const violationEl = document.getElementById(`violations_${this.getCurrentQuestionId()}`);
        if (violationEl) {
            violationEl.style.display = 'block';
            violationEl.querySelector(`#violation_text_${this.getCurrentQuestionId()}`).textContent = description;
        }

        // Log to server
        console.warn('Assessment violation recorded:', violation);
    }

    nextQuestion(currentQuestionNumber, questionId) {
        // Save current answer
        this.saveCurrentAnswer();

        // Move to next question
        if (currentQuestionNumber < this.data.questions.length) {
            this.showQuestion(currentQuestionNumber + 1);
        } else {
            this.completeAssessment();
        }
    }

    async completeAssessment() {
        if (this.isCompleted) return;

        this.isCompleted = true;

        // Clear timers
        if (this.timers.total) clearInterval(this.timers.total);
        if (this.timers.question) clearInterval(this.timers.question);

        // Save final answer
        this.saveCurrentAnswer();

        try {
            // Submit completion to server
            const response = await fetch(`/jobseeker/api/assessment/${this.data.assessmentId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    violations: this.violations,
                    total_time: Math.floor((new Date() - this.startTime) / 1000)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to complete assessment');
            }

            const result = await response.json();

            // Hide question content and show completion panel
            document.getElementById('questionContent').style.display = 'none';
            document.getElementById('completionPanel').style.display = 'block';

            // Update completion stats
            const totalTimeTaken = Math.floor((new Date() - this.startTime) / 1000);
            const minutes = Math.floor(totalTimeTaken / 60);
            const seconds = totalTimeTaken % 60;
            
            document.getElementById('totalTimeTaken').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Hide webcam monitor
            const webcamMonitor = document.getElementById('webcamMonitor');
            if (webcamMonitor) {
                webcamMonitor.style.display = 'none';
            }

            // Stop webcam stream
            if (this.webcamStream) {
                this.webcamStream.getTracks().forEach(track => track.stop());
            }

            window.notifications.success('Assessment completed successfully!');

        } catch (error) {
            console.error('Error completing assessment:', error);
            window.notifications.error('Failed to submit assessment. Please contact support.');
        }
    }
}

// Global functions called from HTML
window.nextQuestion = function(currentNumber, questionId) {
    if (window.assessmentManager) {
        window.assessmentManager.nextQuestion(currentNumber, questionId);
    }
};

window.completeAssessment = function() {
    if (window.assessmentManager) {
        window.assessmentManager.completeAssessment();
    }
};

window.reportIssue = function() {
    window.notifications.info('Issue reporting feature will be implemented');
};

window.runCode = function(questionId) {
    const codeTextarea = document.getElementById(`code_${questionId}`);
    const languageSelect = document.getElementById(`language_${questionId}`);
    const outputDiv = document.getElementById(`output_${questionId}`);
    
    if (!codeTextarea || !languageSelect || !outputDiv) {
        console.error('Required elements not found');
        return;
    }
    
    const code = codeTextarea.value;
    const language = languageSelect.value;
    
    if (!code.trim()) {
        outputDiv.innerHTML = '<div class="alert alert-warning">Please write some code first.</div>';
        return;
    }
    
    // Show loading state
    outputDiv.innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin me-2"></i>Executing code...</div>';
    
    // Submit code execution request
    fetch(`/jobseeker/api/assessment/${window.assessmentManager.data.assessmentId}/submit-answer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question_id: questionId,
            code_answer: code,
            code_language: language
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // The code execution result should be in the response
            outputDiv.innerHTML = `<div class="alert alert-success"><strong>Code executed successfully!</strong></div>
                                  <pre class="bg-dark text-light p-3 rounded mt-2">${data.output || 'No output'}</pre>`;
        } else {
            outputDiv.innerHTML = '<div class="alert alert-danger">Failed to execute code.</div>';
        }
    })
    .catch(error => {
        console.error('Code execution failed:', error);
        outputDiv.innerHTML = '<div class="alert alert-danger">Error executing code.</div>';
    });
};

// Initialize assessment when data is provided
window.initializeAssessment = function(assessmentData) {
    window.assessmentManager = new AssessmentManager(assessmentData);
};
