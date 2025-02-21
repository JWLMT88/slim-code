class Tabs {
    constructor() {
        this.container = document.getElementById('tabs-container');
        this.tabs = new Map(); 
        this.activeTab = null;
        this.pendingFiles = new Map();
        this.autoSaveInterval = null;
        
        this.init();
    }

    init() {
        registerShortcut('w', () => this.closeActiveTab());
        this.setupAutoSave();
        this.setupContentChangeListener();
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.activeTab) {
                this.saveActiveTab();
            }
        }, 3000);
    }

    setupContentChangeListener() {
        if (window.editor && window.editor.editor) {
            window.editor.editor.onDidChangeModelContent(() => {
                if (this.activeTab) {
                    const content = window.editor.getValue();
                    this.updateFileContent(this.activeTab, content);
                }
            });
        } else {
            setTimeout(() => this.setupContentChangeListener(), 1000);
        }
    }

    updateFileContent(path, content) {
        // Update pending files
        const pendingFile = this.pendingFiles.get(path);
        if (pendingFile) {
            pendingFile.content = content;
        } else {
            this.pendingFiles.set(path, {
                content: content,
                language: getFileLanguage(path)
            });
        }

        // Update file system if available
        if (window.explorer && window.explorer.fileSystem) {
            // Navigate through file system to find and update the file
            const parts = path.split('/').filter(Boolean);
            let current = window.explorer.fileSystem;

            // Navigate to the parent directory
            for (const part of parts.slice(0, -1)) {
                if (!current[part] || current[part].type !== 'directory') return false;
                current = current[part].children;
            }

            // Get the file name and update its content
            const fileName = parts[parts.length - 1];
            if (current[fileName]) {
                current[fileName].content = content;
                try {
                    saveToLocalStorage('fileSystem', window.explorer.fileSystem);
                    
                    // Also update the explorer's current file if it matches
                    if (window.explorer.currentFile && window.explorer.currentFile.path === path) {
                        window.explorer.currentFile.file.content = content;
                    }
                    
                    return true;
                } catch (error) {
                    console.error('Error saving file:', error);
                    return false;
                }
            }
        }
        return true; // Return true if only pending file was updated
    }

    async activateTab(path) {
        // Get tab element
        const tab = this.tabs.get(path);
        if (!tab) {
            console.warn(`Tab not found for path: ${path}`);
            return;
        }

        // Deactivate current tab
        if (this.activeTab) {
            const currentTab = this.tabs.get(this.activeTab);
            if (currentTab) {
                currentTab.classList.remove('border-t-2', 'border-editor-accent');
                currentTab.classList.add('py-1.5');
                await this.saveActiveTab();
            }
        }

        // Activate new tab
        tab.classList.add('border-t-2', 'border-editor-accent');
        tab.classList.remove('py-1.5');
        this.activeTab = path;

        // Ensure tab is visible (scroll into view)
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

        // Get the most up-to-date content
        const content = this.getLatestContent(path);
        const language = getFileLanguage(path);

        // Update editor content
        if (window.editor) {
            await window.editor.setValue(content, language);
        }
    }

    async openTab(path, file) {
        if (this.tabs.has(path)) {
            await this.activateTab(path);
            return;
        }

        const tab = createElement('div', 'group px-4  py-1.5 flex items-center space-x-2 border-r border-gray-700 bg-editor-bg cursor-pointer hover:bg-gray-800 transition-colors tab-enter');
        
        tab.innerHTML = `
            <span class="material-icons text-sm">${file.icon}</span>
            <span class="text-sm">${getFileName(path)}</span>
            <button class="opacity-0 group-hover:opacity-100 flex justify-center items-center w-4 h-4 ml-2 hover:text-red-400s">
                <span class="material-icons text-sm">close</span>
            </button>
        `;

        tab.addEventListener('click', () => this.activateTab(path));
        tab.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(path);
        });

        tab.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                this.closeTab(path);
            }
        });

        this.container.appendChild(tab);
        this.tabs.set(path, tab);
        
        this.pendingFiles.set(path, {
            content: file.content,
            language: getFileLanguage(path)
        });
        
        await this.activateTab(path);
    }

    getLatestContent(path) {
        // First check pending files for the most recent content
        const pendingFile = this.pendingFiles.get(path);
        if (pendingFile) {
            return pendingFile.content;
        }

        // Then check file system
        const file = this.getFileFromPath(path);
        if (file) {
            return file.content;
        }

        return '';
    }

    async closeTab(path) {
        const tab = this.tabs.get(path);
        if (!tab) return;

        // Save content before closing
        if (path === this.activeTab) {
            await this.saveActiveTab();
        }

        // Remove tab element with animation
        tab.style.opacity = '0';
        tab.style.transform = 'translateY(-10px)';
        setTimeout(() => removeElement(tab), 200);

        this.tabs.delete(path);
        this.pendingFiles.delete(path);

        // If closing active tab, activate another one
        if (path === this.activeTab) {
            const tabs = Array.from(this.tabs.keys());
            if (tabs.length > 0) {
                await this.activateTab(tabs[tabs.length - 1]);
            } else {
                this.activeTab = null;
                if (window.editor && window.editor.isReady()) {
                    await window.editor.setValue('');
                }
            }
        }
    }

    closeActiveTab() {
        if (this.activeTab) {
            this.closeTab(this.activeTab);
        }
    }

    getFileFromPath(path) {
        // Check if we have a pending file first
        const pendingFile = this.pendingFiles.get(path);
        if (pendingFile) {
            return {
                content: pendingFile.content,
                type: 'file'
            };
        }

        // If explorer is not initialized yet, return null
        if (!window.explorer || !window.explorer.fileSystem) {
            return null;
        }

        // Navigate through file system to find file
        const parts = path.split('/').filter(Boolean);
        let current = window.explorer.fileSystem;

        for (const part of parts.slice(0, -1)) {
            if (!current[part] || current[part].type !== 'directory') return null;
            current = current[part].children;
        }

        const fileName = parts[parts.length - 1];
        return current[fileName];
    }

    async saveActiveTab() {
        if (!this.activeTab) return false;

        try {
            if (!window.editor || !window.editor.isReady()) {
                console.warn('Editor not ready for saving');
                return false;
            }

            const currentContent = window.editor.getValue();
            const success = this.updateFileContent(this.activeTab, currentContent);
            
            if (success && window.explorer && window.explorer.fileSystem) {
                saveToLocalStorage('fileSystem', window.explorer.fileSystem);
                window.projects.saveSession();
                return success;
            }
            return false;
        } catch (error) {
            console.error('Error saving active tab:', error);
            return false;
        }
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.tabs = new Tabs();
});

window.addEventListener('beforeunload', () => {
    if (window.tabs) {
        window.tabs.destroy();
    }
}); 