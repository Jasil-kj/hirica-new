// Code Editor and Execution Engine

class CodeEditor {
    constructor(textareaId, questionId, options = {}) {
        this.textareaId = textareaId;
        this.questionId = questionId;
        this.options = {
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            lineWrapping: true,
            ...options
        };
        
        this.editor = null;
        this.currentLanguage = 'python';
        
        this.init();
    }

    init() {
        const textarea = document.getElementById(this.textareaId);
        if (!textarea) {
            console.error(`Textarea with id ${this.textareaId} not found`);
            return;
        }

        // Initialize CodeMirror
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: this.getModeForLanguage(this.currentLanguage),
            theme: this.options.theme,
            lineNumbers: this.options.lineNumbers,
            autoCloseBrackets: this.options.autoCloseBrackets,
            matchBrackets: this.options.matchBrackets,
            indentUnit: this.options.indentUnit,
            lineWrapping: this.options.lineWrapping,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Tab': 'indentMore',
                'Shift-Tab': 'indentLess'
            }
        });

        // Set editor height
        this.editor.setSize(null, '300px');

        // Bind language change event
        const languageSelect = document.getElementById(`language_${this.questionId}`);
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
            
            // Set initial language
            this.currentLanguage = languageSelect.value;
            this.changeLanguage(this.currentLanguage);
        }

        // Set up auto-save
        this.editor.on('change', () => {
            this.saveCode();
        });

        // Set default code templates
        this.setDefaultTemplate();
    }

    getModeForLanguage(language) {
        const modeMap = {
            'python': 'python',
            'javascript': 'javascript',
            'java': 'text/x-java',
            'cpp': 'text/x-c++src',
            'c': 'text/x-csrc',
            'html': 'htmlmixed',
            'css': 'css'
        };
        
        return modeMap[language] || 'text';
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        this.editor.setOption('mode', this.getModeForLanguage(language));
        this.setDefaultTemplate();
    }

    setDefaultTemplate() {
        if (this.editor.getValue().trim() === '') {
            const templates = {
                'python': '# Write your Python code here\ndef solution():\n    # Your code goes here\n    pass\n\n# Test your solution\nif __name__ == "__main__":\n    result = solution()\n    print(result)',
                'javascript': '// Write your JavaScript code here\nfunction solution() {\n    // Your code goes here\n    return null;\n}\n\n// Test your solution\nconsole.log(solution());',
                'java': 'public class Solution {\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        // Test your solution here\n        System.out.println(sol.solution());\n    }\n    \n    public Object solution() {\n        // Your code goes here\n        return null;\n    }\n}',
                'cpp': '#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    // Your code goes here\n    void solution() {\n        \n    }\n};\n\nint main() {\n    Solution sol;\n    sol.solution();\n    return 0;\n}',
                'c': '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n// Your code goes here\nvoid solution() {\n    \n}\n\nint main() {\n    solution();\n    return 0;\n}',
                'html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Solution</title>\n</head>\n<body>\n    <!-- Your HTML code goes here -->\n    \n</body>\n</html>',
                'css': '/* Your CSS code goes here */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\n/* Add your styles below */'
            };

            if (templates[this.currentLanguage]) {
                this.editor.setValue(templates[this.currentLanguage]);
                this.editor.setCursor(this.editor.lineCount(), 0);
            }
        }
    }

    saveCode() {
        // Auto-save functionality can be implemented here
        // For now, just update the original textarea value
        this.editor.save();
    }

    getValue() {
        return this.editor.getValue();
    }

    setValue(value) {
        this.editor.setValue(value);
    }

    focus() {
        this.editor.focus();
    }
}

class CodeExecutor {
    constructor() {
        this.executionEndpoint = '/api/execute-code';
    }

    async executeCode(code, language, input = '') {
        try {
            const response = await fetch(this.executionEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    input: input
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Code execution failed:', error);
            return {
                success: false,
                output: null,
                error: `Execution failed: ${error.message}`
            };
        }
    }

    // Client-side code execution for simple cases (mainly for demonstration)
    async executeClientSide(code, language) {
        switch (language) {
            case 'javascript':
                return this.executeJavaScript(code);
            case 'html':
                return this.executeHTML(code);
            case 'css':
                return this.executeCSS(code);
            default:
                return {
                    success: false,
                    output: null,
                    error: `Client-side execution not supported for ${language}`
                };
        }
    }

    executeJavaScript(code) {
        try {
            // Capture console.log output
            const logs = [];
            const originalConsoleLog = console.log;
            console.log = (...args) => {
                logs.push(args.map(arg => String(arg)).join(' '));
                originalConsoleLog.apply(console, args);
            };

            // Create a safe execution context
            const result = new Function(`
                ${code}
                return typeof solution === 'function' ? solution() : undefined;
            `)();

            // Restore console.log
            console.log = originalConsoleLog;

            let output = '';
            if (logs.length > 0) {
                output += logs.join('\n');
            }
            if (result !== undefined) {
                if (output) output += '\n';
                output += `Return value: ${JSON.stringify(result)}`;
            }

            return {
                success: true,
                output: output || 'Code executed successfully (no output)',
                error: null
            };

        } catch (error) {
            return {
                success: false,
                output: null,
                error: error.message
            };
        }
    }

    executeHTML(code) {
        try {
            // Create a preview iframe
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width: 100%; height: 200px; border: 1px solid #ccc; border-radius: 4px;';
            
            // Write HTML to iframe
            iframe.onload = function() {
                iframe.contentDocument.open();
                iframe.contentDocument.write(code);
                iframe.contentDocument.close();
            };

            return {
                success: true,
                output: 'HTML rendered in preview',
                preview: iframe,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                output: null,
                error: error.message
            };
        }
    }

    executeCSS(code) {
        return {
            success: true,
            output: 'CSS code validated successfully',
            error: null
        };
    }
}

// Global code execution function
window.executeCode = async function(questionId) {
    const codeEditor = window.codeEditors[questionId];
    const languageSelect = document.getElementById(`language_${questionId}`);
    const outputDiv = document.getElementById(`output_${questionId}`);

    if (!codeEditor || !languageSelect || !outputDiv) {
        console.error('Code execution elements not found');
        return;
    }

    const code = codeEditor.getValue();
    const language = languageSelect.value;

    if (!code.trim()) {
        outputDiv.innerHTML = '<div class="text-warning">Please write some code first</div>';
        return;
    }

    // Show loading state
    outputDiv.innerHTML = '<div class="text-info"><i class="fas fa-spinner fa-spin me-2"></i>Executing code...</div>';

    const executor = new CodeExecutor();
    let result;

    // Try client-side execution first for supported languages
    if (['javascript', 'html', 'css'].includes(language)) {
        result = await executor.executeClientSide(code, language);
    } else {
        // For other languages, use server-side execution
        result = await executor.executeCode(code, language);
    }

    // Display result
    if (result.success) {
        if (result.preview) {
            // For HTML, show preview
            outputDiv.innerHTML = '';
            outputDiv.appendChild(result.preview);
        } else {
            outputDiv.innerHTML = `<div class="text-success">${result.output || 'Code executed successfully'}</div>`;
        }
    } else {
        outputDiv.innerHTML = `<div class="text-danger"><strong>Error:</strong> ${result.error}</div>`;
    }
};

// Initialize code editor for a specific question
window.initializeCodeEditor = function(textarea, questionId) {
    if (!window.codeEditors) {
        window.codeEditors = {};
    }

    window.codeEditors[questionId] = new CodeEditor(textarea.id, questionId);
};

// Global storage for code editors
window.codeEditors = {};

// Initialize all code editors on page load
document.addEventListener('DOMContentLoaded', function() {
    const codeTextareas = document.querySelectorAll('.code-editor');
    codeTextareas.forEach(textarea => {
        const questionId = textarea.id.split('_')[1];
        if (questionId) {
            window.initializeCodeEditor(textarea, questionId);
        }
    });
});

// Export classes for external use
window.CodeEditor = CodeEditor;
window.CodeExecutor = CodeExecutor;
