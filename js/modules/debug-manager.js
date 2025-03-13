class DebugManager {
    constructor() {
        this.console = document.querySelector('.debug-console');
        this.clearButton = document.querySelector('.clear-console');
        this.previewButton = document.querySelector('.preview-button');
        this.previewWindow = null;
        this.currentPreviewPath = null;
        this.previewSyncInterval = null;
        this.entryCount = 0;
        this.maxEntries = 500; // Limit entries to prevent performance issues
        this.init();
    }
    init() {
        if (!this.console || !this.clearButton || !this.previewButton) {
            console.error('Debug elements not found');
            return;
        }
        this.setupEventListeners();
        this.interceptConsole();
        this.showEmptyState();
    }
    setupEventListeners() {
        this.clearButton.addEventListener('click', () => this.clearConsole());
        this.previewButton.addEventListener('click', () => this.openPreview());
        // Add filter button event listener
        const filterButton = document.querySelector('.filter-console');
        if (filterButton) {
            filterButton.addEventListener('click', () => this.showFilterOptions());
        }
        // Add save button event listener
        const saveButton = document.querySelector('.save-console');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveConsoleOutput());
        }
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
        // Remove empty state if present
        this.removeEmptyState();
        // Create entry element
        const entry = document.createElement('div');
        entry.className = `debug-entry debug-${type}`;
        // Create header with timestamp and type indicator
        const header = document.createElement('div');
        header.className = 'flex items-center';
        // Create type indicator
        const typeIndicator = document.createElement('span');
        typeIndicator.className = 'debug-type-indicator';
        typeIndicator.setAttribute('aria-hidden', 'true');
        switch(type) {
            case 'log':
                typeIndicator.textContent = 'L';
                break;
            case 'error':
                typeIndicator.textContent = 'E';
                break;
            case 'warn':
                typeIndicator.textContent = 'W';
                break;
            case 'info':
                typeIndicator.textContent = 'I';
                break;
        }
        // Create timestamp
        const timestamp = document.createElement('span');
        timestamp.className = 'debug-timestamp';
        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // Add elements to header
        header.appendChild(typeIndicator);
        header.appendChild(timestamp);
        // Create content container
        const content = document.createElement('div');
        content.className = 'debug-content';
        // Process arguments
        args.forEach((arg, index) => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    // For objects, create a formatted display
                    const objStr = JSON.stringify(arg, null, 2);
                    const objElem = document.createElement('pre');
                    objElem.className = 'debug-object';
                    objElem.textContent = objStr;
                    content.appendChild(objElem);
                } catch (e) {
                    // If JSON stringify fails
                    const textElem = document.createElement('span');
                    textElem.textContent = String(arg);
                    content.appendChild(textElem);
                }
            } else {
                // For primitive types
                const textElem = document.createElement('span');
                textElem.textContent = String(arg);
                if (index > 0) {
                    textElem.textContent = ' ' + textElem.textContent;
                }
                content.appendChild(textElem);
            }
        });
        // Add header and content to entry
        entry.appendChild(header);
        entry.appendChild(content);
        // Add entry to console
        this.console.appendChild(entry);
        // Scroll to bottom
        this.console.scrollTop = this.console.scrollHeight;
        // Increment entry count
        this.entryCount++;
        // Limit the number of entries to prevent performance issues
        if (this.entryCount > this.maxEntries) {
            const oldestEntry = this.console.querySelector('.debug-entry');
            if (oldestEntry) {
                oldestEntry.remove();
                this.entryCount--;
            }
        }
    }
    clearConsole() {
        this.console.innerHTML = '';
        this.entryCount = 0;
        this.showEmptyState();
    }
    showEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'debug-empty';
        const icon = document.createElement('span');
        icon.className = 'material-icons debug-empty-icon';
        icon.textContent = 'code';
        icon.setAttribute('aria-hidden', 'true');
        const text = document.createElement('p');
        text.className = 'debug-empty-text';
        text.textContent = 'Console is empty';
        const subText = document.createElement('p');
        subText.className = 'text-xs opacity-70 mt-1';
        subText.textContent = 'Application logs will appear here';
        emptyState.appendChild(icon);
        emptyState.appendChild(text);
        emptyState.appendChild(subText);
        this.console.appendChild(emptyState);
    }
    removeEmptyState() {
        const emptyState = this.console.querySelector('.debug-empty');
        if (emptyState) {
            emptyState.remove();
        }
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
    showFilterOptions() {
        // Create filter modal content
        const modalContent = `
            <div class="space-y-4">
                <p class="text-sm text-editor-text-muted mb-4">Select which types of messages to show in the console:</p>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="filter-log" class="console-filter" data-type="log" checked>
                    <label for="filter-log" class="flex items-center cursor-pointer">
                        <span class="inline-block w-3 h-3 rounded-full bg-editor-text-muted mr-2"></span>
                        <span>Log messages</span>
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="filter-info" class="console-filter" data-type="info" checked>
                    <label for="filter-info" class="flex items-center cursor-pointer">
                        <span class="inline-block w-3 h-3 rounded-full bg-editor-accent mr-2"></span>
                        <span>Info messages</span>
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="filter-warn" class="console-filter" data-type="warn" checked>
                    <label for="filter-warn" class="flex items-center cursor-pointer">
                        <span class="inline-block w-3 h-3 rounded-full bg-editor-warning mr-2"></span>
                        <span>Warning messages</span>
                    </label>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="checkbox" id="filter-error" class="console-filter" data-type="error" checked>
                    <label for="filter-error" class="flex items-center cursor-pointer">
                        <span class="inline-block w-3 h-3 rounded-full bg-editor-error mr-2"></span>
                        <span>Error messages</span>
                    </label>
                </div>
            </div>
        `;
        // Show modal with filter options
        if (window.slimCodeEditor && window.slimCodeEditor.modals) {
            window.slimCodeEditor.modals.show({
                title: 'Console Filters',
                content: modalContent,
                onConfirm: () => this.applyFilters()
            });
            // Add event listeners to checkboxes
            document.querySelectorAll('.console-filter').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.applyFilters());
            });
        }
    }
    applyFilters() {
        const filters = {
            log: document.getElementById('filter-log')?.checked ?? true,
            info: document.getElementById('filter-info')?.checked ?? true,
            warn: document.getElementById('filter-warn')?.checked ?? true,
            error: document.getElementById('filter-error')?.checked ?? true
        };
        // Apply filters to console entries
        document.querySelectorAll('.debug-entry').forEach(entry => {
            if (entry.classList.contains('debug-log') && !filters.log) {
                entry.style.display = 'none';
            } else if (entry.classList.contains('debug-info') && !filters.info) {
                entry.style.display = 'none';
            } else if (entry.classList.contains('debug-warn') && !filters.warn) {
                entry.style.display = 'none';
            } else if (entry.classList.contains('debug-error') && !filters.error) {
                entry.style.display = 'none';
            } else {
                entry.style.display = 'block';
            }
        });
    }
    saveConsoleOutput() {
        // Get all visible console entries
        const entries = Array.from(document.querySelectorAll('.debug-entry'))
            .filter(entry => entry.style.display !== 'none');
        if (entries.length === 0) {
            // Show notification if no entries to save
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'No Console Output',
                    message: 'There are no console entries to save.',
                    type: 'info'
                });
            }
            return;
        }
        // Format entries as text
        let output = '# Console Output\n';
        output += `# Generated: ${new Date().toLocaleString()}\n\n`;
        entries.forEach(entry => {
            const timestamp = entry.querySelector('.debug-timestamp')?.textContent || '';
            const content = entry.querySelector('.debug-content')?.textContent || '';
            let type = '';
            if (entry.classList.contains('debug-log')) type = 'LOG';
            else if (entry.classList.contains('debug-info')) type = 'INFO';
            else if (entry.classList.contains('debug-warn')) type = 'WARN';
            else if (entry.classList.contains('debug-error')) type = 'ERROR';
            output += `[${timestamp}] [${type}] ${content.trim()}\n`;
        });
        // Create download link
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `console-output-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        // Clean up
        URL.revokeObjectURL(url);
        // Show notification
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'Console Output Saved',
                message: 'Console output has been saved to a text file.',
                type: 'success'
            });
        }
    }
} 

