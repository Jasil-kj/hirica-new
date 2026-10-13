// Hirica - Main JavaScript File

(function() {
    'use strict';

    // Theme Management
    class ThemeManager {
        constructor() {
            this.currentTheme = localStorage.getItem('hirica-theme') || 'dark';
            this.themeToggle = document.getElementById('themeToggle');
            this.themeIcon = document.getElementById('themeIcon');
            
            this.init();
        }

        init() {
            this.applyTheme(this.currentTheme);
            this.bindEvents();
        }

        bindEvents() {
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }
        }

        toggleTheme() {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(this.currentTheme);
            localStorage.setItem('hirica-theme', this.currentTheme);
        }

        applyTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            
            if (this.themeIcon) {
                if (theme === 'dark') {
                    this.themeIcon.className = 'fas fa-sun';
                } else {
                    this.themeIcon.className = 'fas fa-moon';
                }
            }
        }
    }

    // Notification System
    class NotificationManager {
        constructor() {
            this.container = this.createContainer();
        }

        createContainer() {
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
            }
            return container;
        }

        show(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show`;
            notification.style.cssText = `
                margin-bottom: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            `;
            
            const iconMap = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-triangle',
                warning: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };

            notification.innerHTML = `
                <i class="fas ${iconMap[type]} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;

            this.container.appendChild(notification);

            // Auto-dismiss
            if (duration > 0) {
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.classList.remove('show');
                        setTimeout(() => {
                            if (notification.parentNode) {
                                notification.remove();
                            }
                        }, 150);
                    }
                }, duration);
            }

            return notification;
        }

        success(message, duration) {
            return this.show(message, 'success', duration);
        }

        error(message, duration) {
            return this.show(message, 'danger', duration);
        }

        warning(message, duration) {
            return this.show(message, 'warning', duration);
        }

        info(message, duration) {
            return this.show(message, 'info', duration);
        }
    }

    // Form Utilities
    class FormUtils {
        static validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        static validatePhone(phone) {
            const re = /^[\+]?[1-9][\d]{0,15}$/;
            return re.test(phone.replace(/\s/g, ''));
        }

        static validatePassword(password, minLength = 6) {
            return password.length >= minLength;
        }

        static showFieldError(field, message) {
            this.clearFieldError(field);
            
            field.classList.add('is-invalid');
            
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            
            field.parentNode.appendChild(feedback);
        }

        static clearFieldError(field) {
            field.classList.remove('is-invalid');
            
            const feedback = field.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }
        }

        static clearAllErrors(form) {
            const invalidFields = form.querySelectorAll('.is-invalid');
            invalidFields.forEach(field => this.clearFieldError(field));
        }
    }

    // Loading States
    class LoadingManager {
        static showButton(button, loadingText = 'Loading...') {
            if (button.hasAttribute('data-loading')) return;
            
            button.setAttribute('data-loading', 'true');
            button.setAttribute('data-original-text', button.innerHTML);
            button.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${loadingText}`;
            button.disabled = true;
        }

        static hideButton(button) {
            if (!button.hasAttribute('data-loading')) return;
            
            button.removeAttribute('data-loading');
            button.innerHTML = button.getAttribute('data-original-text');
            button.removeAttribute('data-original-text');
            button.disabled = false;
        }

        static showSpinner(container) {
            const spinner = document.createElement('div');
            spinner.className = 'text-center py-4';
            spinner.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i>';
            spinner.id = 'loading-spinner';
            
            container.appendChild(spinner);
            return spinner;
        }

        static hideSpinner(container) {
            const spinner = container.querySelector('#loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    // AJAX Utilities
    class AjaxUtils {
        static async request(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            const mergedOptions = { ...defaultOptions, ...options };

            try {
                const response = await fetch(url, mergedOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            } catch (error) {
                console.error('AJAX request failed:', error);
                throw error;
            }
        }

        static async get(url, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            
            return this.request(fullUrl);
        }

        static async post(url, data = {}) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        static async put(url, data = {}) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }

        static async delete(url) {
            return this.request(url, {
                method: 'DELETE'
            });
        }
    }

    // Auto-save functionality
    class AutoSave {
        constructor(form, endpoint, interval = 30000) {
            this.form = form;
            this.endpoint = endpoint;
            this.interval = interval;
            this.timeoutId = null;
            this.lastSaved = {};
            
            this.init();
        }

        init() {
            this.bindEvents();
            this.startAutoSave();
        }

        bindEvents() {
            const inputs = this.form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.scheduleAutoSave();
                });
            });
        }

        scheduleAutoSave() {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }

            this.timeoutId = setTimeout(() => {
                this.performAutoSave();
            }, 2000); // Wait 2 seconds after last change
        }

        startAutoSave() {
            this.autoSaveInterval = setInterval(() => {
                this.performAutoSave();
            }, this.interval);
        }

        async performAutoSave() {
            try {
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                
                // Only save if data has changed
                if (JSON.stringify(data) === JSON.stringify(this.lastSaved)) {
                    return;
                }

                await AjaxUtils.post(this.endpoint, data);
                this.lastSaved = { ...data };
                
                this.showAutoSaveIndicator('saved');
            } catch (error) {
                console.error('Auto-save failed:', error);
                this.showAutoSaveIndicator('error');
            }
        }

        showAutoSaveIndicator(status) {
            let indicator = document.getElementById('autosave-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'autosave-indicator';
                indicator.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    z-index: 1000;
                `;
                document.body.appendChild(indicator);
            }

            if (status === 'saved') {
                indicator.innerHTML = '<i class="fas fa-check me-1"></i>Auto-saved';
                indicator.className = 'bg-success text-white';
            } else if (status === 'error') {
                indicator.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i>Save failed';
                indicator.className = 'bg-danger text-white';
            }

            indicator.style.display = 'block';
            
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }

        destroy() {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
        }
    }

    // Copy to Clipboard
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    // File Upload Handler
    function handleFileUpload(input, options = {}) {
        const defaultOptions = {
            maxSize: 16 * 1024 * 1024, // 16MB
            allowedTypes: ['pdf', 'doc', 'docx'],
            onSuccess: () => {},
            onError: () => {}
        };

        const config = { ...defaultOptions, ...options };

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check file size
            if (file.size > config.maxSize) {
                config.onError('File size exceeds maximum limit');
                input.value = '';
                return;
            }

            // Check file type
            const extension = file.name.split('.').pop().toLowerCase();
            if (!config.allowedTypes.includes(extension)) {
                config.onError(`File type not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
                input.value = '';
                return;
            }

            config.onSuccess(file);
        });
    }

    // Search functionality
    function initializeSearch(input, resultsContainer, searchEndpoint) {
        let searchTimeout;

        input.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    LoadingManager.showSpinner(resultsContainer);
                    const results = await AjaxUtils.get(searchEndpoint, { q: query });
                    
                    LoadingManager.hideSpinner(resultsContainer);
                    displaySearchResults(results, resultsContainer);
                } catch (error) {
                    LoadingManager.hideSpinner(resultsContainer);
                    console.error('Search failed:', error);
                }
            }, 300);
        });
    }

    function displaySearchResults(results, container) {
        if (!results || results.length === 0) {
            container.innerHTML = '<div class="text-muted text-center py-3">No results found</div>';
            return;
        }

        const html = results.map(result => `
            <div class="search-result-item">
                <h6>${result.title}</h6>
                <p class="text-muted">${result.description}</p>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Initialize tooltips and popovers
    function initializeBootstrapComponents() {
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });

        // Initialize popovers
        const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
        popovers.forEach(popover => {
            new bootstrap.Popover(popover);
        });
    }

    // Character counter for textareas
    function initializeCharacterCounters() {
        const textareas = document.querySelectorAll('textarea[data-max-length]');
        
        textareas.forEach(textarea => {
            const maxLength = parseInt(textarea.getAttribute('data-max-length'));
            const counter = document.createElement('div');
            counter.className = 'form-text text-end';
            textarea.parentNode.appendChild(counter);

            function updateCounter() {
                const currentLength = textarea.value.length;
                counter.textContent = `${currentLength}/${maxLength}`;
                
                if (currentLength > maxLength * 0.9) {
                    counter.className = 'form-text text-end text-warning';
                } else if (currentLength > maxLength) {
                    counter.className = 'form-text text-end text-danger';
                } else {
                    counter.className = 'form-text text-end text-muted';
                }
            }

            textarea.addEventListener('input', updateCounter);
            updateCounter();
        });
    }

    // Smooth scroll for anchor links
    function initializeSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // Debounce utility
    function debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize theme manager
        window.themeManager = new ThemeManager();
        
        // Initialize notification manager
        window.notifications = new NotificationManager();
        
        // Initialize Bootstrap components
        initializeBootstrapComponents();
        
        // Initialize character counters
        initializeCharacterCounters();
        
        // Initialize smooth scroll
        initializeSmoothScroll();

        // Auto-hide alerts after 5 seconds
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.classList.remove('show');
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.remove();
                        }
                    }, 150);
                }
            }, 5000);
        });

        // Initialize file upload handlers
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            handleFileUpload(input, {
                onError: (message) => {
                    window.notifications.error(message);
                },
                onSuccess: (file) => {
                    console.log('File selected:', file.name);
                }
            });
        });

        // Add loading states to forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    LoadingManager.showButton(submitButton, 'Processing...');
                }
            });
        });
    });

    // Export utilities to global scope
    window.HiricaUtils = {
        ThemeManager,
        NotificationManager,
        FormUtils,
        LoadingManager,
        AjaxUtils,
        AutoSave,
        copyToClipboard,
        debounce
    };

})();
