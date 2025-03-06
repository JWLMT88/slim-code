/**
 * Editor Class
 * Manages the Monaco editor instance and provides editor-related functionality
 */
class Editor {
    constructor() {
        this.editor = null;
        this.container = document.querySelector('.editor-container');
        this.editorElement = null;
        this.welcomeScreen = document.querySelector('.welcome-screen');
        this.statusBar = {
            position: document.querySelector('.status-bar-item[data-id="position"]'),
            encoding: document.querySelector('.status-bar-item[data-id="encoding"]'),
            fileType: document.querySelector('.status-bar-item[data-id="fileType"]'),
            indentSize: document.querySelector('.status-bar-item[data-id="indentation"]'),
            mode: document.querySelector('.status-bar-item[data-id="editorMode"]')
        };
        
        this.init();
    }
    
    /**
     * Initialize the editor
     */
    init() {
        // Create editor element if it doesn't exist
        if (!document.getElementById('monaco-editor')) {
            this.editorElement = document.createElement('div');
            this.editorElement.id = 'monaco-editor';
            this.editorElement.className = 'h-full w-full';
            this.container.appendChild(this.editorElement);
        } else {
            this.editorElement = document.getElementById('monaco-editor');
        }
        
        // Initialize Monaco editor when required
        require(['vs/editor/editor.main'], () => {
            // Create editor instance (hidden initially)
            this.editor = monaco.editor.create(this.editorElement, {
                value: '',
                language: 'plaintext',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: {
                    enabled: true,
                    scale: 0.8,
                    renderCharacters: false
                },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                tabSize: 4,
                wordWrap: 'off',
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                renderLineHighlight: 'all',
                scrollbar: {
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                }
            });
            
            // Register editor events
            this.registerEditorEvents();
            
            // Hide editor initially
            this.hideEditor();
            
            console.log('Monaco editor initialized');
            
            // Dispatch event that editor is ready
            window.dispatchEvent(new CustomEvent('editorReady'));
        });
    }
    
    /**
     * Register editor events
     */
    registerEditorEvents() {
        if (!this.editor) return;
        
        // Update cursor position in status bar
        this.editor.onDidChangeCursorPosition(e => {
            const position = e.position;
            
            // Update status bar
            if (window.slimCodeEditor && window.slimCodeEditor.statusBar) {
                window.slimCodeEditor.statusBar.updateItem('position', `Ln ${position.lineNumber}, Col ${position.column}`, 'right');
            }
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('editorCursorChange', {
                detail: {
                    lineNumber: position.lineNumber,
                    column: position.column
                }
            }));
        });
        
        // Handle content changes
        this.editor.onDidChangeModelContent(() => {
            // Update file status (modified)
            if (window.slimCodeEditor && window.slimCodeEditor.tabs) {
                window.slimCodeEditor.tabs.markActiveTabAsModified();
            }
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('editorContentChange'));
        });
    }
    
    /**
     * Set editor content
     * @param {string} content - The content to set
     * @param {string} language - The language mode
     */
    setContent(content, language = 'plaintext') {
        if (!this.editor) return;
        
        // Create a new model with the content and language
        const model = monaco.editor.createModel(content, language);
        this.editor.setModel(model);
        
        // Update status bar
        this.updateStatusBar(language);
        
        // Show editor, hide welcome screen
        this.showEditor();
        
        // Focus editor
        this.editor.focus();
    }
    
    /**
     * Get editor content
     * @returns {string} The editor content
     */
    getContent() {
        if (!this.editor) return '';
        return this.editor.getValue();
    }
    
    /**
     * Show the editor and hide welcome screen
     */
    showEditor() {
        if (this.editorElement) {
            this.editorElement.style.display = 'block';
        }
        
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'none';
        }
    }
    
    /**
     * Hide the editor and show welcome screen
     */
    hideEditor() {
        if (this.editorElement) {
            this.editorElement.style.display = 'none';
        }
        
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'flex';
        }
    }
    
    /**
     * Update the status bar with file information
     * @param {string} language - The language mode
     */
    updateStatusBar(language) {
        const languageNames = {
            'plaintext': 'Plain Text',
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'markdown': 'Markdown',
            'python': 'Python',
            'java': 'Java',
            'csharp': 'C#',
            'cpp': 'C++',
            'php': 'PHP'
        };
        
        const displayLanguage = languageNames[language] || language;
        
        // Update status bar items
        if (window.slimCodeEditor && window.slimCodeEditor.statusBar) {
            window.slimCodeEditor.statusBar.updateItem('fileType', displayLanguage, 'right');
            window.slimCodeEditor.statusBar.updateItem('encoding', 'UTF-8', 'right');
        }
    }
    
    /**
     * Set editor theme
     * @param {string} theme - The theme name
     */
    setTheme(theme) {
        if (!this.editor) return;
        
        monaco.editor.setTheme(theme);
        localStorage.setItem('slim-code-editor-theme', theme);
    }
    
    /**
     * Set editor font size
     * @param {number} size - The font size in pixels
     */
    setFontSize(size) {
        if (!this.editor) return;
        
        this.editor.updateOptions({ fontSize: size });
        localStorage.setItem('slim-code-editor-font-size', size.toString());
    }
    
    /**
     * Set editor word wrap
     * @param {string} wordWrap - The word wrap mode
     */
    setWordWrap(wordWrap) {
        if (!this.editor) return;
        
        this.editor.updateOptions({ wordWrap });
        localStorage.setItem('slim-code-editor-word-wrap', wordWrap);
    }
    
    /**
     * Set editor tab size
     * @param {number} tabSize - The tab size
     */
    setTabSize(tabSize) {
        if (!this.editor) return;
        
        this.editor.updateOptions({ tabSize });
        localStorage.setItem('slim-code-editor-tab-size', tabSize.toString());
        
        // Update status bar
        if (window.slimCodeEditor && window.slimCodeEditor.statusBar) {
            window.slimCodeEditor.statusBar.updateItem('indentation', `Spaces: ${tabSize}`, 'right');
        }
    }
    
    /**
     * Show find widget
     */
    showFindWidget() {
        if (!this.editor) return;
        
        this.editor.getAction('actions.find').run();
    }
    
    /**
     * Show command palette
     */
    showCommandPalette() {
        if (!this.editor) return;
        
        this.editor.getAction('editor.action.quickCommand').run();
    }
} 