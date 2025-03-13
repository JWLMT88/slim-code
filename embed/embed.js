class EmbedMode {
    constructor() {
        this.container = document.querySelector('.embed-container');
        this.header = document.querySelector('.embed-header');
        this.footer = document.querySelector('.embed-footer');
        this.editorContainer = document.querySelector('.embed-editor-container');
        this.title = document.querySelector('.embed-title');
        this.fileInfo = document.querySelector('.embed-file-info');
        this.themeSelect = document.querySelector('.embed-theme-select');
        this.openLink = document.querySelector('.embed-open-link');
        this.editor = null;
        this.config = this.parseQueryParams();
        this.init();
    }
    init() {
        this.applyConfig();
        this.initEditor();
        this.addEventListeners();
    }
    parseQueryParams() {
        const params = new URLSearchParams(window.location.search);
        let sourceType = params.get('source') || 'file';
        if (params.get('content') && !params.get('source')) {
            sourceType = 'content';
        }
        if (!params.get('path') && sourceType === 'file' && params.get('content')) {
            sourceType = 'content';
        }
        return {
            path: params.get('path') || '',
            content: params.get('content') || '',
            language: params.get('lang') || this.getLanguageFromPath(params.get('path')) || 'javascript',
            theme: params.get('theme') || 'vs-dark',
            title: params.get('title') || this.getFilenameFromPath(params.get('path')) || 'Code Snippet',
            showHeader: params.get('header') !== 'false',
            showFooter: params.get('footer') !== 'false',
            readOnly: params.get('readOnly') !== 'false',
            fontSize: parseInt(params.get('fontSize')) || 14,
            tabSize: parseInt(params.get('tabSize')) || 4,
            wordWrap: params.get('wordWrap') === 'true',
            lineNumbers: params.get('lineNumbers') !== 'false',
            minimap: params.get('minimap') === 'true',
            highlightLines: this.parseLineNumbers(params.get('highlight')),
            startLine: parseInt(params.get('startLine')) || 1,
            endLine: parseInt(params.get('endLine')) || null,
            openUrl: params.get('openUrl') || '',
            source: sourceType,
            repo: params.get('repo') || '',
            branch: params.get('branch') || 'main',
            githubUser: params.get('githubUser') || '',
            githubRepo: params.get('githubRepo') || '',
            githubPath: params.get('githubPath') || '',
            gistId: params.get('gistId') || '',
            gistFile: params.get('gistFile') || '',
        };
    }
    applyConfig() {
        if (this.themeSelect) {
            this.themeSelect.value = this.config.theme;
        }
        if (this.title) {
            this.title.textContent = this.config.title;
        }
        if (!this.config.showHeader && this.header) {
            this.header.classList.add('hidden');
        }
        if (!this.config.showFooter && this.footer) {
            this.footer.classList.add('hidden');
        }
        if (this.fileInfo) {
            const filename = this.getFilenameFromPath(this.config.path);
            const language = this.config.language;
            this.fileInfo.innerHTML = `
                ${filename ? `<span class="embed-file-name">${filename}</span>` : ''}
                ${language ? `<span class="embed-file-language">${language}</span>` : ''}
            `;
        }
        if (this.openLink) {
            const openUrl = this.config.openUrl || this.getOpenUrl();
            this.openLink.href = openUrl;
        }
    }
    initEditor() {
        this.showLoading();
        require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(document.getElementById('embed-monaco-editor'), {
                value: '',
                language: this.config.language,
                theme: this.config.theme,
                readOnly: this.config.readOnly,
                fontSize: this.config.fontSize,
                tabSize: this.config.tabSize,
                wordWrap: this.config.wordWrap ? 'on' : 'off',
                lineNumbers: this.config.lineNumbers ? 'on' : 'off',
                minimap: {
                    enabled: this.config.minimap
                },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fixedOverflowWidgets: true,
                scrollbar: {
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                },
                fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                fontLigatures: true
            });
            this.loadContent()
                .then(() => {
                    this.applyLineHighlighting();
                    this.hideLoading();
                    this.editor.layout();
                    window.addEventListener('resize', () => {
                        if (this.editor) {
                            this.editor.layout();
                        }
                    });
                })
                .catch(error => {
                    console.error('Error loading content:', error);
                    this.showError('Failed to load content', error.message);
                });
        });
    }
    addEventListeners() {
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                monaco.editor.setTheme(theme);
            });
        }
    }
    async loadContent() {
        try {
            switch (this.config.source) {
                case 'content':
                    if (!this.config.content) {
                        throw new Error('No content provided. Use the "content" parameter to specify code content.');
                    }
                    return this.setEditorContent(this.config.content);
                case 'github':
                    return this.loadFromGitHub();
                case 'gist':
                    return this.loadFromGist();
                case 'file':
                default:
                    return this.loadFromFile();
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Failed to load content', error.message);
            throw error;
        }
    }
    async loadFromFile() {
        if (!this.config.path) {
            throw new Error('No file path specified. Use the "path" parameter to specify a file path.');
        }
        try {
            const response = await fetch(this.config.path);
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.statusText}`);
            }
            const content = await response.text();
            return this.setEditorContent(content);
        } catch (error) {
            console.error('Error loading file:', error);
            throw error;
        }
    }
    async loadFromGitHub() {
        const user = this.config.githubUser || this.config.repo.split('/')[0];
        const repo = this.config.githubRepo || this.config.repo.split('/')[1];
        const path = this.config.githubPath || this.config.path;
        const branch = this.config.branch;
        if (!user || !repo || !path) {
            throw new Error('Missing GitHub parameters');
        }
        const url = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load from GitHub: ${response.statusText}`);
            }
            const data = await response.json();
            const content = atob(data.content);
            return this.setEditorContent(content);
        } catch (error) {
            console.error('Error loading from GitHub:', error);
            throw error;
        }
    }
    async loadFromGist() {
        const gistId = this.config.gistId;
        const gistFile = this.config.gistFile;
        if (!gistId) {
            throw new Error('Missing Gist ID');
        }
        const url = `https://api.github.com/gists/${gistId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load from Gist: ${response.statusText}`);
            }
            const data = await response.json();
            let content = '';
            let filename = '';
            if (gistFile && data.files[gistFile]) {
                content = data.files[gistFile].content;
                filename = gistFile;
            } else {
                const firstFile = Object.keys(data.files)[0];
                content = data.files[firstFile].content;
                filename = firstFile;
            }
            if (!this.config.language) {
                this.config.language = this.getLanguageFromPath(filename);
                if (this.editor) {
                    monaco.editor.setModelLanguage(this.editor.getModel(), this.config.language);
                }
            }
            if (!this.config.title && this.title) {
                this.title.textContent = filename;
            }
            return this.setEditorContent(content);
        } catch (error) {
            console.error('Error loading from Gist:', error);
            throw error;
        }
    }
    setEditorContent(content) {
        if (!this.editor) return Promise.reject(new Error('Editor not initialized'));
        if (this.config.startLine > 1 || this.config.endLine) {
            const lines = content.split('\n');
            const startLine = Math.max(1, this.config.startLine) - 1;
            const endLine = this.config.endLine ? Math.min(lines.length, this.config.endLine) : lines.length;
            content = lines.slice(startLine, endLine).join('\n');
        }
        this.editor.setValue(content);
        return Promise.resolve();
    }
    applyLineHighlighting() {
        if (!this.editor || !this.config.highlightLines || this.config.highlightLines.length === 0) {
            return;
        }
        const decorations = this.config.highlightLines.map(line => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                className: 'highlight-line'
            }
        }));
        this.editor.deltaDecorations([], decorations);
    }
    parseLineNumbers(lineString) {
        if (!lineString) return [];
        const lines = [];
        const parts = lineString.split(',');
        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    lines.push(i);
                }
            } else {
                lines.push(Number(part));
            }
        });
        return lines.filter(line => !isNaN(line));
    }
    getLanguageFromPath(path) {
        if (!path) return '';
        const extension = path.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'markdown': 'markdown',
            'py': 'python',
            'python': 'python',
            'rb': 'ruby',
            'ruby': 'ruby',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'php': 'php',
            'sql': 'sql',
            'swift': 'swift',
            'sh': 'shell',
            'bash': 'shell',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        return languageMap[extension] || '';
    }
    getFilenameFromPath(path) {
        if (!path) return '';
        const parts = path.split('/');
        return parts[parts.length - 1];
    }
    getOpenUrl() {
        const baseUrl = window.location.href.split('/embed')[0];
        switch (this.config.source) {
            case 'github':
                const user = this.config.githubUser || this.config.repo.split('/')[0];
                const repo = this.config.githubRepo || this.config.repo.split('/')[1];
                return `${baseUrl}?github=${user}/${repo}&path=${this.config.githubPath || this.config.path}`;
            case 'gist':
                return `${baseUrl}?gist=${this.config.gistId}${this.config.gistFile ? `&file=${this.config.gistFile}` : ''}`;
            case 'file':
            default:
                return `${baseUrl}?file=${this.config.path}`;
        }
    }
    showLoading() {
        if (!document.querySelector('.embed-loading')) {
            const loading = document.createElement('div');
            loading.className = 'embed-loading';
            loading.innerHTML = `
                <div class="embed-loading-spinner"></div>
                <div class="embed-loading-text">Loading code...</div>
            `;
            this.editorContainer.appendChild(loading);
        }
    }
    hideLoading() {
        const loading = document.querySelector('.embed-loading');
        if (loading) {
            loading.remove();
        }
    }
    showError(title, message) {
        this.hideLoading();
        const error = document.createElement('div');
        error.className = 'embed-error';
        error.innerHTML = `
            <div class="embed-error-icon">⚠️</div>
            <div class="embed-error-title">${title}</div>
            <div class="embed-error-message">${message}</div>
        `;
        this.editorContainer.appendChild(error);
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.embedMode = new EmbedMode();
});

