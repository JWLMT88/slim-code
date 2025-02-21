class App {
    constructor() {
        this.init();
    }

    init() {
        this.initKeyboardShortcuts();
        this.initStatusBarButtons();
        this.initWindowEvents();
        this.initTheme();
        this.initNotifications();
    }

    initKeyboardShortcuts() {
        Object.entries(KEYBOARD_SHORTCUTS).forEach(([action, shortcut]) => {
            const key = shortcut.split('+').pop().toLowerCase();
            
            registerShortcut(key, () => {
                switch(action) {
                    case 'save':
                        if (window.tabs.activeTab) {
                            window.tabs.saveActiveTab();
                            this.showSaveIndicator();
                        }
                        break;
                    case 'newFile':
                        if (window.projects.currentProject) {
                            window.explorer.createNewFile();
                        } else {
                            this.showNotification('No Project Open', 'Please create or open a project first', 'warning');
                        }
                        break;
                    case 'openFile':
                        if (window.projects.currentProject) {
                        } else {
                            this.showNotification('No Project Open', 'Please create or open a project first', 'warning');
                        }
                        break;
                    case 'find':
                        if (window.editor.editor) {
                            window.editor.editor.getAction('actions.find').run();
                        }
                        break;
                    case 'replace':
                        if (window.editor.editor) {
                            window.editor.editor.getAction('editor.action.startFindReplaceAction').run();
                        }
                        break;
                    case 'commandPalette':
                        if (window.editor.editor) {
                            window.editor.showCommandPalette();
                        }
                        break;
                }
            });
        });
    }

    initStatusBarButtons() {
        document.querySelector('footer [title="New File"]').addEventListener('click', () => {
            if (window.projects.currentProject) {
                window.explorer.createNewFile();
            } else {
                this.showNotification('No Project Open', 'Please create or open a project first', 'warning');
            }
        });

        document.querySelector('footer [title="Save"]').addEventListener('click', () => {
            if (window.tabs.activeTab) {
                window.tabs.saveActiveTab();
                this.showSaveIndicator();
            }
        });

        document.querySelector('footer [title="Run"]').addEventListener('click', () => {
            if (window.tabs.activeTab) {
                this.runCurrentFile();
            } else {
                this.showNotification('No File Open', 'Please open a file to run', 'warning');
            }
        });

        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
    }

    initWindowEvents() {
        window.addEventListener('beforeunload', (e) => {
           
            if (window.projects.currentProject) {
                window.projects.saveSession();
            }

            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'You are now connected to the internet');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection lost', 'You are now working offline', 'warning');
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('editorTheme') || 'vs-dark';
        this.setTheme(savedTheme);
        document.getElementById('theme-select').value = savedTheme;
    }

    setTheme(theme) {
        if (window.editor && window.editor.editor) {
            window.editor.editor.updateOptions({ theme });
            localStorage.setItem('editorTheme', theme);
        }
    }

    initNotifications() {
        // Create notifications container
        const container = createElement('div', 'fixed bottom-4 right-4 space-y-2 z-50');
        container.id = 'notifications';
        document.body.appendChild(container);
    }

    hasUnsavedChanges() {
        if (!window.tabs || !window.tabs.activeTab) return false;
        
        const currentContent = window.editor.getValue();
        const savedContent = window.tabs.getLatestContent(window.tabs.activeTab);
        return currentContent !== savedContent;
    }

    runCurrentFile() {
        const activeTab = window.tabs.activeTab;
        if (!activeTab) return;

        const file = window.tabs.getFileFromPath(activeTab);
        if (!file) return;

        const extension = getFileExtension(activeTab);
        
        switch(extension) {
            case 'js':
                this.runJavaScript(file.content);
                break;
            case 'html':
                this.runProject(activeTab);
                break;
            default:
                this.showNotification('Cannot run file', `Running .${extension} files is not supported`, 'error');
        }
    }

    runJavaScript(code) {
        try {
            // Create sandbox iframe
            const sandbox = document.createElement('iframe');
            sandbox.style.display = 'none';
            document.body.appendChild(sandbox);

            // Execute code in sandbox
            const result = sandbox.contentWindow.eval(code);
            console.log('Execution result:', result);

            // Cleanup
            document.body.removeChild(sandbox);
        } catch (error) {
            console.error('Execution error:', error);
            this.showNotification('Execution Error', error.message, 'error');
        }
    }

    runProject(htmlPath) {
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.close();
        }

        // Calculate window size and position
        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // Create a new popup window
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

        // Set initial content
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
                    <label id="auto-reload">
                        <input type="checkbox" id="auto-reload-toggle" checked>
                        Auto-reload
                    </label>
                    <button class="preview-button" onclick="window.location.reload()">Refresh</button>
                </div>
                <div id="preview-loading">Loading project...</div>
            </body>
            </html>
        `);

        // Store reference to the preview window
        this.currentPreviewPath = htmlPath;

        // Setup auto-reload functionality
        this.setupPreviewSync();

        // Get and inject project files
        this.updatePreview();
    }

    updatePreview() {
        if (!this.previewWindow || this.previewWindow.closed || !this.currentPreviewPath) return;

        const projectFiles = this.getProjectFiles(this.currentPreviewPath);
        
        // Create a base element to handle relative paths
        const base = this.previewWindow.document.createElement('base');
        base.href = `project:///${getParentPath(this.currentPreviewPath)}/`;
        
        // Process HTML content
        const modifiedHtml = this.processHtmlContent(projectFiles.html, projectFiles);
        
        // Update the preview window content
        this.previewWindow.document.open();
        this.previewWindow.document.write(modifiedHtml);
        this.previewWindow.document.close();

        // Restore toolbar
        this.injectPreviewToolbar();

        // Setup console logging
        this.setupPreviewConsole();
    }

    setupPreviewSync() {
        // Clear existing sync interval
        if (this.previewSyncInterval) {
            clearInterval(this.previewSyncInterval);
        }

        // Setup new sync interval
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
        }, 1000); // Check for changes every second
    }

    setupPreviewConsole() {
        if (!this.previewWindow) return;

        this.previewWindow.console = {
            log: (...args) => {
                console.log('Preview:', ...args);
                this.showNotification('Console Log', args.join(' '), 'info');
            },
            error: (...args) => {
                console.error('Preview:', ...args);
                this.showNotification('Console Error', args.join(' '), 'error');
            },
            warn: (...args) => {
                console.warn('Preview:', ...args);
                this.showNotification('Console Warning', args.join(' '), 'warning');
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

    getProjectFiles(htmlPath) {
        const result = {
            html: '',
            styles: new Map(),
            scripts: new Map()
        };

        // Get the HTML content
        const htmlFile = window.tabs.getFileFromPath(htmlPath);
        if (htmlFile) {
            result.html = htmlFile.content;

            // Parse HTML to find linked resources
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlFile.content, 'text/html');

            // Get stylesheets
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const stylePath = this.resolveRelativePath(htmlPath, href);
                    const styleFile = window.tabs.getFileFromPath(stylePath);
                    if (styleFile) {
                        result.styles.set(href, styleFile.content);
                    }
                }
            });

            // Get scripts
            doc.querySelectorAll('script[src]').forEach(script => {
                const src = script.getAttribute('src');
                if (src) {
                    const scriptPath = this.resolveRelativePath(htmlPath, src);
                    const scriptFile = window.tabs.getFileFromPath(scriptPath);
                    if (scriptFile) {
                        result.scripts.set(src, scriptFile.content);
                    }
                }
            });
        }

        return result;
    }

    resolveRelativePath(basePath, relativePath) {
        const baseDir = getParentPath(basePath);
        return normalizePath(`${baseDir}/${relativePath}`);
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

    showSaveIndicator() {
        const saveButton = document.querySelector('footer [title="Save"]');
        const icon = saveButton.querySelector('.material-icons');
        const originalText = icon.textContent;
        
        icon.textContent = 'check';
        saveButton.classList.add('text-green-500');
        
        setTimeout(() => {
            icon.textContent = originalText;
            saveButton.classList.remove('text-green-500');
        }, 1000);
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = createElement('div', `notification p-4 rounded-lg shadow-lg animate__animated animate__fadeInRight ${this.getNotificationClass(type)}`);
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="material-icons text-sm">${this.getNotificationIcon(type)}</span>
                <div>
                    <h4 class="font-semibold">${title}</h4>
                    <p class="text-sm opacity-90">${message}</p>
                </div>
            </div>
        `;

        container.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
            setTimeout(() => removeElement(notification), 500);
        }, 3000);
    }

    getNotificationClass(type) {
        const classes = {
            info: 'bg-blue-500 text-white',
            success: 'bg-green-500 text-white',
            warning: 'bg-yellow-500 text-white',
            error: 'bg-red-500 text-white'
        };
        return classes[type] || classes.info;
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info',
            success: 'check_circle',
            warning: 'warning',
            error: 'error'
        };
        return icons[type] || icons.info;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 