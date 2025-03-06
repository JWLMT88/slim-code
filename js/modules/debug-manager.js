class DebugManager {
    constructor() {
        this.console = document.querySelector('.debug-console');
        this.clearButton = document.querySelector('.clear-console');
        this.previewButton = document.querySelector('.preview-button');
        this.previewWindow = null;
        this.currentPreviewPath = null;
        this.previewSyncInterval = null;
        
        this.init();
    }
    
    init() {
        if (!this.console || !this.clearButton || !this.previewButton) {
            console.error('Debug elements not found');
            return;
        }
        
        this.setupEventListeners();
        this.interceptConsole();
    }
    
    setupEventListeners() {
        this.clearButton.addEventListener('click', () => this.clearConsole());
        this.previewButton.addEventListener('click', () => this.openPreview());
    }
    
    interceptConsole() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        const self = this;
        
        console.log = function() { self.logToDebugConsole('log', ...arguments); originalConsole.log.apply(console, arguments); };
        console.error = function() { self.logToDebugConsole('error', ...arguments); originalConsole.error.apply(console, arguments); };
        console.warn = function() { self.logToDebugConsole('warn', ...arguments); originalConsole.warn.apply(console, arguments); };
        console.info = function() { self.logToDebugConsole('info', ...arguments); originalConsole.info.apply(console, arguments); };
    }
    
    logToDebugConsole(type, ...args) {
        const entry = document.createElement('div');
        entry.className = `debug-entry debug-${type} p-2 rounded`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'text-editor-text-muted mr-2';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        const content = document.createElement('span');
        content.textContent = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        entry.appendChild(timestamp);
        entry.appendChild(content);
        this.console.appendChild(entry);
        this.console.scrollTop = this.console.scrollHeight;
    }
    
    clearConsole() {
        this.console.innerHTML = '';
    }
    
    async openPreview() {
        const files = await window.slimCodeEditor.fileExplorer.getCurrentProjectFiles();
        const indexPath = Object.keys(files).find(path => path.endsWith('index.html')) || 'index.html';
        this.unProject(indexPath);
    }

    unProject(htmlPath) {
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.close();
        }

        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        this.previewWindow = window.open('', 'preview', `
            width=${width},
            height=${height},
            left=${left},
            top=${top},
            menubar=no,
            toolbar=no,
            location=no,
            status=no,
            resizable=yes,
            scrollbars=yes
        `);

        this.previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Project Preview</title>
                <style>
                    #preview-toolbar {
                        position: fixed;
                        top: 0;
                        right: 0;
                        background: #1e1e1e;
                        color: white;
                        padding: 8px;
                        border-radius: 0 0 0 8px;
                        display: flex;
                        gap: 8px;
                        z-index: 9999;
                        opacity: 0.3;
                        transition: opacity 0.2s;
                    }
                    #preview-toolbar:hover {
                        opacity: 1;
                    }
                    .preview-button {
                        background: #333;
                        border: none;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .preview-button:hover {
                        background: #444;
                    }
                    #auto-reload {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        color: #888;
                    }
                    #preview-loading {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #1e1e1e;
                        color: white;
                        padding: 16px 24px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }
                </style>
            </head>
            <body>
                <div id="preview-toolbar">
                </div>
                <div id="preview-loading">Loading project...</div>
            </body>
            </html>
        `);
        this.currentPreviewPath = htmlPath;

        //this.setupPreviewSync();

        this.updatePreview();
    }

    async updatePreview() {
        if (!this.previewWindow || this.previewWindow.closed || !this.currentPreviewPath) return;

        const projectFiles = await this.getProjectFiles(this.currentPreviewPath);
        
        const base = this.previewWindow.document.createElement('base');
        base.href = `project:///${this.getParentPath(this.currentPreviewPath)}/`;
        
        const modifiedHtml = this.processHtmlContent(projectFiles.html, projectFiles);
        
        this.previewWindow.document.open();
        this.previewWindow.document.write(modifiedHtml);
        this.previewWindow.document.close();

        //this.injectPreviewToolbar();

        this.setupPreviewConsole();
    }

    setupPreviewSync() {
        if (this.previewSyncInterval) {
            clearInterval(this.previewSyncInterval);
        }

        this.previewSyncInterval = setInterval(() => {
            if (this.previewWindow && !this.previewWindow.closed) {
                const autoReloadToggle = this.previewWindow.document.getElementById('auto-reload-toggle');
                if (autoReloadToggle && autoReloadToggle.checked) {
                    this.updatePreview();
                }
            } else {
                // Clear interval if window is closed
                clearInterval(this.previewSyncInterval);
                this.previewSyncInterval = null;
                this.previewWindow = null;
                this.currentPreviewPath = null;
            }
        }, 1000); 
    }

    setupPreviewConsole() {
        if (!this.previewWindow) return;

        this.previewWindow.console = {
            log: (...args) => {
                this.logToDebugConsole('log', ...args);
                console.log('Preview:', ...args);
            },
            error: (...args) => {
                this.logToDebugConsole('error', ...args);
                console.error('Preview:', ...args);
            },
            warn: (...args) => {
                this.logToDebugConsole('warn', ...args);
                console.warn('Preview:', ...args);
            },
            info: (...args) => {
                this.logToDebugConsole('info', ...args);
                console.info('Preview:', ...args);
            }
        };
    }

    injectPreviewToolbar() {
        if (!this.previewWindow) return;

        const toolbar = this.previewWindow.document.getElementById('preview-toolbar');
        if (!toolbar) {
            const newToolbar = this.previewWindow.document.createElement('div');
            newToolbar.id = 'preview-toolbar';
            newToolbar.innerHTML = `
                <label id="auto-reload">
                    <input type="checkbox" id="auto-reload-toggle" checked>
                    Auto-reload
                </label>
                <button class="preview-button" onclick="window.location.reload()">Refresh</button>
            `;
            this.previewWindow.document.body.appendChild(newToolbar);
        }
    }

    async getProjectFiles(htmlPath) {
        const result = {
            html: '',
            styles: new Map(),
            scripts: new Map()
        };

        // Get all project files
        const files = await window.slimCodeEditor.fileExplorer.getCurrentProjectFiles();
        
        // Get the HTML content
        const htmlContent = files[htmlPath] || files['/' + htmlPath];
        if (htmlContent) {
            result.html = htmlContent;

            // Parse HTML to find linked resources
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Get stylesheets
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const stylePath = this.resolveRelativePath(htmlPath, href);
                    const styleContent = files[stylePath] || files['/' + stylePath];
                    if (styleContent) {
                        result.styles.set(href, styleContent);
                    }
                }
            });

            // Get scripts
            doc.querySelectorAll('script[src]').forEach(script => {
                const src = script.getAttribute('src');
                if (src) {
                    const scriptPath = this.resolveRelativePath(htmlPath, src);
                    const scriptContent = files[scriptPath] || files['/' + scriptPath];
                    if (scriptContent) {
                        result.scripts.set(src, scriptContent);
                    }
                }
            });
        }

        return result;
    }

    resolveRelativePath(basePath, relativePath) {
        const baseDir = this.getParentPath(basePath);
        return this.normalizePath(`${baseDir}/${relativePath}`);
    }

    getParentPath(path) {
        return path.split('/').slice(0, -1).join('/');
    }

    normalizePath(path) {
        return path.replace(/^[\/]+|[\/]+$/g, '').replace(/\/+/g, '/');
    }

    processHtmlContent(html, projectFiles) {
        let processedHtml = html;

        // Replace stylesheet links with inline styles or blob URLs
        projectFiles.styles.forEach((content, href) => {
            const blob = new Blob([content], { type: 'text/css' });
            const blobUrl = URL.createObjectURL(blob);
            processedHtml = processedHtml.replace(
                new RegExp(`href=["']${href}["']`, 'g'),
                `href="${blobUrl}"`
            );
        });

        // Replace script sources with blob URLs
        projectFiles.scripts.forEach((content, src) => {
            const blob = new Blob([content], { type: 'text/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            processedHtml = processedHtml.replace(
                new RegExp(`src=["']${src}["']`, 'g'),
                `src="${blobUrl}"`
            );
        });

        return processedHtml;
    }
} 