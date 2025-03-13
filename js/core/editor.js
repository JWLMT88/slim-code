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
        this.resizeTimeout = null;
        this.init();
    }
    init() {
        if (!document.getElementById('monaco-editor')) {
            this.editorElement = document.createElement('div');
            this.editorElement.id = 'monaco-editor';
            this.editorElement.className = 'h-full w-full';
            this.container.appendChild(this.editorElement);
        } else {
            this.editorElement = document.getElementById('monaco-editor');
        }
        require(['vs/editor/editor.main'], () => {
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
                },
                fixedOverflowWidgets: true,
                mouseWheelZoom: true,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: true,
                renderWhitespace: 'selection',
                renderControlCharacters: true,
                renderIndentGuides: true,
                rulers: [],
                colorDecorators: true
            });
            this.registerEditorEvents();
            window.addEventListener('resize', this.handleWindowResize.bind(this));
            this.hideEditor();
            console.log('Monaco editor initialized');
            window.dispatchEvent(new CustomEvent('editorReady'));
        });
    }
    registerEditorEvents() {
        if (!this.editor) return;
        this.editor.onDidChangeCursorPosition(e => {
            const position = e.position;
            if (window.slimCodeEditor && window.slimCodeEditor.statusBar) {
                window.slimCodeEditor.statusBar.updateItem('position', `Ln ${position.lineNumber}, Col ${position.column}`, 'right');
            }
            window.dispatchEvent(new CustomEvent('editorCursorChange', {
                detail: {
                    lineNumber: position.lineNumber,
                    column: position.column
                }
            }));
        });
        this.editor.onDidChangeModelContent(e => {
            window.dispatchEvent(new CustomEvent('editorContentChange', {
                detail: {
                    changes: e.changes
                }
            }));
        });
        this.editor.onDidFocusEditorText(() => {
            this.container.classList.add('editor-focused');
        });
        this.editor.onDidBlurEditorText(() => {
            this.container.classList.remove('editor-focused');
        });
        this.editorElement.addEventListener('mousedown', (e) => {
            if (!this.editor.hasTextFocus()) {
                this.editor.focus();
            }
        });
    }
    handleWindowResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.editor) {
                this.editor.layout();
            }
        }, 100);
    }
    fixCursorPlacement() {
        if (!this.editor) return;
        this.editor.layout();
        const position = this.editor.getPosition();
        if (!position) return;
        const tempPosition = {
            lineNumber: position.lineNumber,
            column: position.column + 1
        };
        const model = this.editor.getModel();
        if (model && tempPosition.column <= model.getLineMaxColumn(tempPosition.lineNumber)) {
            this.editor.setPosition(tempPosition);
            this.editor.setPosition(position);
        }
    }
    setContent(content, language = 'plaintext') {
        if (!this.editor) return;
        const currentModel = this.editor.getModel();
        if (currentModel) {
            currentModel.dispose();
        }
        const model = monaco.editor.createModel(content, language);
        this.editor.setModel(model);
        this.updateStatusBar(language);
        this.showEditor();
        this.editor.layout();
        this.fixCursorPlacement();
    }
    getContent() {
        if (!this.editor) return '';
        return this.editor.getValue();
    }
    showEditor() {
        if (!this.editor || !this.welcomeScreen) return;
        this.welcomeScreen.style.display = 'none';
        this.editorElement.style.display = 'block';
        this.editor.layout();
        this.fixCursorPlacement();
        this.editor.focus();
    }
    hideEditor() {
        if (this.editorElement) {
            this.editorElement.style.display = 'none';
        }
        if (this.welcomeScreen) {
            this.welcomeScreen.style.display = 'flex';
        }
    }
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
        if (window.slimCodeEditor && window.slimCodeEditor.statusBar) {
            window.slimCodeEditor.statusBar.updateItem('fileType', displayLanguage, 'right');
            window.slimCodeEditor.statusBar.updateItem('encoding', 'UTF-8', 'right');
        }
    }
    setTheme(theme) {
        if (!this.editor) return;
        monaco.editor.setTheme(theme);
        localStorage.setItem('slim-code-editor-theme', theme);
    }
    setFontSize(size) {
        if (!this.editor) return;
        this.editor.updateOptions({ fontSize: size });
        localStorage.setItem('slim-code-editor-font-size', size.toString());
    }
    setWordWrap(wordWrap) {
        if (!this.editor) return;
        this.editor.updateOptions({ wordWrap });
        localStorage.setItem('slim-code-editor-word-wrap', wordWrap);
    }
    setTabSize(tabSize) {
        if (!this.editor) return;
        this.editor.updateOptions({ tabSize });
        localStorage.setItem('slim-code-editor-tab-size', tabSize.toString());
        if (window.slimCodeEditor && window.slimCodeEditor.statusBar) {
            window.slimCodeEditor.statusBar.updateItem('indentation', `Spaces: ${tabSize}`, 'right');
        }
    }
    showFindWidget() {
        if (!this.editor) return;
        this.editor.getAction('actions.find').run();
    }
    showCommandPalette() {
        if (!this.editor) return;
        this.editor.getAction('editor.action.quickCommand').run();
    }
}

