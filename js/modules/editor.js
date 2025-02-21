class Editor {
    constructor() {
        this.container = document.getElementById('monaco-editor');
        this.editor = null;
        this.activeExtensions = new Set();
        this.isInitialized = false;
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve) => {
            // Load the Monaco editor features
            require(['vs/editor/editor.main'], () => {
                // Configure JavaScript language features
                monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: false,
                    noSyntaxValidation: false,
                    diagnosticCodesToIgnore: []
                });

                // Configure JavaScript compiler options
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ESNext,
                    allowNonTsExtensions: true,
                    allowJs: true,
                    checkJs: true,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    module: monaco.languages.typescript.ModuleKind.CommonJS,
                    noEmit: true,
                    esModuleInterop: true,
                    jsx: monaco.languages.typescript.JsxEmit.React,
                    typeRoots: ["node_modules/@types"]
                });

                // Configure editor theme
                monaco.editor.defineTheme('custom-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                        { token: 'comment', foreground: '6A9955' },
                        { token: 'keyword', foreground: '569CD6' },
                        { token: 'string', foreground: 'CE9178' },
                        { token: 'number', foreground: 'B5CEA8' },
                        { token: 'regexp', foreground: 'D16969' },
                        { token: 'type', foreground: '4EC9B0' },
                        { token: 'class', foreground: '4EC9B0' },
                        { token: 'function', foreground: 'DCDCAA' },
                        { token: 'variable', foreground: '9CDCFE' },
                        { token: 'constant', foreground: '4FC1FF' }
                    ],
                    colors: {
                        'editor.background': '#1E1E1E',
                        'editor.foreground': '#D4D4D4',
                        'editor.lineHighlightBackground': '#2F2F2F',
                        'editor.selectionBackground': '#264F78',
                        'editor.inactiveSelectionBackground': '#3A3D41'
                    }
                });

                this.initializeEditor();
                this.setupCommands();
                this.registerEventListeners();
                this.setupLanguages();
                this.isInitialized = true;
                resolve();
            });
        });
    }

    initializeEditor() {
        // Create the editor with enhanced configuration
        this.editor = monaco.editor.create(this.container, {
            value: '// Welcome to simply code.\n// Start coding here...',
            language: 'javascript',
            theme: 'custom-dark',
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            minimap: { 
                enabled: true,
                scale: 0.8,
                renderCharacters: false
            },
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            foldingStrategy: 'indentation',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true
            },
            suggest: {
                preview: true,
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true
            },
            quickSuggestions: {
                other: true,
                comments: true,
                strings: true
            }
        });

        // Register the JavaScript formatter
        monaco.languages.registerDocumentFormattingEditProvider('javascript', {
            provideDocumentFormattingEdits: (model) => {
                return [{
                    range: model.getFullModelRange(),
                    text: this.formatJavaScript(model.getValue())
                }];
            }
        });

        // Force a re-render of the editor
        setTimeout(() => {
            this.editor.layout();
            this.editor.render(true);
        }, 100);
    }

    registerLanguages() {
        const languages = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'php': 'php',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'sql': 'sql',
            'yaml': 'yaml',
            'xml': 'xml'
        };

        // Register file associations
        Object.entries(languages).forEach(([ext, lang]) => {
            monaco.languages.register({ id: lang, extensions: [`.${ext}`] });
        });
    }

    setupExtensions() {
        // Get enabled extensions from localStorage
        const enabledExtensions = getFromLocalStorage('enabledExtensions', ['prettier', 'eslint']);
        
        enabledExtensions.forEach(extId => {
            const extension = window.extensions.getExtension(extId);
            if (extension && extension.enabled) {
                this.activateExtension(extension);
            }
        });
    }

    activateExtension(extension) {
        switch (extension.id) {
            case 'prettier':
                this.setupPrettier();
                break;
            case 'eslint':
                this.setupESLint();
                break;
            // Add more extensions here
        }
        this.activeExtensions.add(extension.id);
    }

    deactivateExtension(extension) {
        // Remove extension functionality
        switch (extension.id) {
            case 'prettier':
                this.editor.updateOptions({ formatOnPaste: false, formatOnType: false });
                break;
            case 'eslint':
                monaco.editor.setModelMarkers(this.editor.getModel(), 'eslint', []);
                break;
        }
        this.activeExtensions.delete(extension.id);
    }

    setupPrettier() {
        // Add format document command
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
            this.formatDocument();
        });

        // Enable format on type and paste
        this.editor.updateOptions({
            formatOnPaste: true,
            formatOnType: true
        });
    }

    setupESLint() {
        // Add ESLint markers provider
        const model = this.editor.getModel();
        if (model) {
            model.onDidChangeContent(() => {
                this.validateWithESLint(model);
            });
        }
    }

    async formatDocument() {
        if (!this.activeExtensions.has('prettier')) return;

        try {
            const model = this.editor.getModel();
            const content = model.getValue();
            const language = model.getLanguageId();

            // Format based on language
            let formatted = content;
            switch (language) {
                case 'javascript':
                case 'typescript':
                    formatted = this.formatJavaScript(content);
                    break;
                case 'html':
                    formatted = this.formatHTML(content);
                    break;
                case 'css':
                case 'scss':
                case 'less':
                    formatted = this.formatCSS(content);
                    break;
            }

            // Apply formatted content
            if (formatted !== content) {
                this.editor.executeEdits('prettier', [{
                    range: model.getFullModelRange(),
                    text: formatted
                }]);
            }
        } catch (error) {
            console.error('Format error:', error);
            window.app.showNotification('Format Error', error.message, 'error');
        }
    }

    validateWithESLint(model) {
        if (!this.activeExtensions.has('eslint')) return;

        const content = model.getValue();
        const language = model.getLanguageId();

        if (language !== 'javascript' && language !== 'typescript') return;

        // Simple lint rules (example)
        const markers = [];
        
        // Check for common issues
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            // Example: Check for console.log
            if (line.includes('console.log')) {
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: 'Avoid using console.log in production code',
                    startLineNumber: i + 1,
                    startColumn: line.indexOf('console.log') + 1,
                    endLineNumber: i + 1,
                    endColumn: line.length + 1
                });
            }

            // Check for unused variables (simple example)
            const varDeclaration = line.match(/(?:let|const|var)\s+(\w+)\s*=/);
            if (varDeclaration) {
                const varName = varDeclaration[1];
                if (!content.split(varDeclaration[0])[1].includes(varName)) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Warning,
                        message: `Variable '${varName}' is declared but never used`,
                        startLineNumber: i + 1,
                        startColumn: line.indexOf(varName) + 1,
                        endLineNumber: i + 1,
                        endColumn: line.indexOf(varName) + varName.length + 1
                    });
                }
            }
        });

        // Set markers
        monaco.editor.setModelMarkers(model, 'eslint', markers);
    }

    formatJavaScript(content) {
        // Basic JS formatting (example)
        return content
            .replace(/{\s*/g, '{\n  ')
            .replace(/;\s*/g, ';\n')
            .replace(/}\s*/g, '}\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    formatHTML(content) {
        // Basic HTML formatting (example)
        return content
            .replace(/>\s*</g, '>\n<')
            .replace(/(<[^>]+>)(?!\n)/g, '$1\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    formatCSS(content) {
        // Basic CSS formatting (example)
        return content
            .replace(/{\s*/g, ' {\n  ')
            .replace(/;\s*/g, ';\n  ')
            .replace(/}\s*/g, '}\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n');
    }

    setupLanguages() {
        // Register JavaScript/TypeScript configuration
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });

        // Enable full JavaScript language features
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            allowJs: true,
            typeRoots: ["node_modules/@types"]
        });

        // Add basic JavaScript/TypeScript type definitions
        const libSource = `
            declare class Console {
                log(...data: any[]): void;
                info(...data: any[]): void;
                warn(...data: any[]): void;
            }
            declare const console: Console;
            declare function setTimeout(callback: Function, ms: number): number;
            declare function setInterval(callback: Function, ms: number): number;
            declare function clearTimeout(id: number): void;
            declare function clearInterval(id: number): void;
        `;

        monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, 'ts:global.d.ts');
    }

    async restoreSession(session) {
        if (!session.openTabs) return;

        // Wait for editor to be fully ready
        await this.initPromise;

        // Restore tabs in sequence
        for (const tab of session.openTabs) {
            const file = window.explorer.getFileFromPath(tab.path);
            if (file) {
                await window.tabs.openTab(tab.path, file);
            }
        }

        // Restore active tab
        if (session.activeTab) {
            await window.tabs.activateTab(session.activeTab);
        }
    }

    async setValue(content, language) {
        await this.initPromise;
        
        if (!this.editor) return;
        
        try {
            const model = this.editor.getModel();
            const monacoLanguage = this.getMonacoLanguage(language);
            
            // Update or create model with correct language
            if (model) {
                monaco.editor.setModelLanguage(model, monacoLanguage);
                model.setValue(content);
            } else {
                const newModel = monaco.editor.createModel(content, monacoLanguage);
                this.editor.setModel(newModel);
            }

            // Apply language-specific formatting
            if (monacoLanguage === 'javascript' || monacoLanguage === 'typescript') {
                monaco.languages.typescript.getJavaScriptWorker().then(worker => {
                    worker(model.uri).then(client => {
                        client.getEmitOutput(model.uri.toString()).then(output => {
                            if (output.outputFiles.length > 0) {
                                const formatted = output.outputFiles[0].text;
                                if (formatted !== content) {
                                    model.setValue(formatted);
                                }
                            }
                        });
                    });
                });
            }

            // Trigger validation if ESLint is active
            if (this.activeExtensions.has('eslint')) {
                this.validateWithESLint(this.editor.getModel());
            }
        } catch (error) {
            console.error('Error setting editor value:', error);
        }
    }

    getMonacoLanguage(fileExtension) {
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'php': 'php',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'sql': 'sql',
            'yaml': 'yaml',
            'xml': 'xml'
        };

        return languageMap[fileExtension] || 'plaintext';
    }

    getValue() {
        if (!this.editor) return '';
        try {
            return this.editor.getValue();
        } catch (error) {
            console.error('Error getting editor value:', error);
            return '';
        }
    }

    updateOptions(options) {
        if (!this.editor) return;
        try {
            this.editor.updateOptions(options);
        } catch (error) {
            console.error('Error updating editor options:', error);
        }
    }

    focus() {
        if (!this.editor) return;
        try {
            this.editor.focus();
        } catch (error) {
            console.error('Error focusing editor:', error);
        }
    }

    isReady() {
        return this.isInitialized && this.editor !== null;
    }

    setupCommands() {
        // Save command (Ctrl/Cmd + S)
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (window.tabs) {
                window.tabs.saveActiveTab();
            }
        });

        // Find command (Ctrl/Cmd + F)
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
            this.editor.getAction('actions.find').run();
        });

        // Replace command (Ctrl/Cmd + H)
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
            this.editor.getAction('editor.action.startFindReplaceAction').run();
        });

        // Format document command (Shift + Alt + F)
        this.editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
            this.formatDocument();
        });

        // Command palette (Ctrl/Cmd + Shift + P)
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
            this.editor.getAction('editor.action.quickCommand').run();
        });
    }

    registerEventListeners() {
        if (!this.editor) return;

        // Editor content change
        this.editor.onDidChangeModelContent(() => {
            const position = this.editor.getPosition();
            document.getElementById('position-indicator').textContent = 
                `Ln ${position.lineNumber}, Col ${position.column}`;
        });

        // Cursor position change
        this.editor.onDidChangeCursorPosition(() => {
            const position = this.editor.getPosition();
            document.getElementById('position-indicator').textContent = 
                `Ln ${position.lineNumber}, Col ${position.column}`;
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.editor.layout();
        });
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new Editor();
});