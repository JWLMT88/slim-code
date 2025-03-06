/**
 * Tabs Class
 * Manages editor tabs for open files
 */
class Tabs {
    constructor() {
        this.container = document.querySelector('.tabs-container');
        this.tabs = [];
        this.activeTab = null;
        
        this.init();
    }
    
    /**
     * Initialize tabs
     */
    init() {
        if (!this.container) return;
        
        // Load tabs from session if available
        this.loadSession();
    }
    
    /**
     * Create a new tab
     * @param {Object} file - File object with path and content
     * @returns {HTMLElement} The created tab element
     */
    createTab(file) {
        if (!this.container) return null;
        
        // Check if tab already exists
        const existingTab = this.findTabByPath(file.path);
        if (existingTab) {
            this.activateTab(existingTab);
            return existingTab.element;
        }
        
        // Create tab element
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.setAttribute('data-path', file.path);
        
        // Get file name from path
        const fileName = file.path.split('/').pop();
        
        // Determine language based on file extension
        const extension = fileName.split('.').pop().toLowerCase();
        const language = this.getLanguageFromExtension(extension);
        
        // Create tab content
        tab.innerHTML = `
            <span class="tab-name">${fileName}</span>
            <button class="tab-close">
                <span class="material-icons text-xs">close</span>
            </button>
        `;
        
        // Add tab to container
        this.container.appendChild(tab);
        
        // Add tab to tabs array
        const tabObj = {
            element: tab,
            path: file.path,
            content: file.content,
            language,
            modified: false
        };
        
        this.tabs.push(tabObj);
        
        // Add event listeners
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                this.activateTab(tabObj);
            }
        });
        
        tab.querySelector('.tab-close').addEventListener('click', () => {
            this.closeTab(tabObj);
        });
        
        // Activate the new tab
        this.activateTab(tabObj);
        
        return tab;
    }
    
    /**
     * Activate a tab
     * @param {Object} tab - Tab object to activate
     */
    activateTab(tab) {
        if (!tab) return;
        
        // Deactivate current active tab
        if (this.activeTab) {
            this.activeTab.element.classList.remove('active');
        }
        
        // Activate new tab
        tab.element.classList.add('active');
        this.activeTab = tab;
        
        // Load content into editor
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            window.slimCodeEditor.editor.setContent(tab.content, tab.language);
        }
        
        // Save session
        this.saveSession();
    }
    
    /**
     * Close a tab
     * @param {Object} tab - Tab object to close
     */
    closeTab(tab) {
        if (!tab) return;
        
        // Check if tab has unsaved changes
        if (tab.modified) {
            if (window.slimCodeEditor && window.slimCodeEditor.modal) {
                window.slimCodeEditor.modal.show({
                    title: 'Unsaved Changes',
                    body: `<p>Do you want to save the changes you made to ${tab.path.split('/').pop()}?</p>`,
                    onConfirm: () => {
                        this.saveTab(tab);
                        this.removeTab(tab);
                    },
                    onCancel: () => {
                        this.removeTab(tab);
                    }
                });
            } else {
                const confirm = window.confirm(`Do you want to save the changes you made to ${tab.path.split('/').pop()}?`);
                if (confirm) {
                    this.saveTab(tab);
                }
                this.removeTab(tab);
            }
        } else {
            this.removeTab(tab);
        }
    }
    
    /**
     * Remove a tab
     * @param {Object} tab - Tab object to remove
     */
    removeTab(tab) {
        if (!tab) return;
        
        // Remove tab element
        tab.element.remove();
        
        // Remove tab from tabs array
        const index = this.tabs.indexOf(tab);
        if (index !== -1) {
            this.tabs.splice(index, 1);
        }
        
        // If this was the active tab, activate another tab
        if (this.activeTab === tab) {
            this.activeTab = null;
            
            if (this.tabs.length > 0) {
                // Activate the next tab or the previous tab if this was the last one
                const newIndex = Math.min(index, this.tabs.length - 1);
                this.activateTab(this.tabs[newIndex]);
            } else {
                // No more tabs, show welcome screen
                if (window.slimCodeEditor && window.slimCodeEditor.editor) {
                    window.slimCodeEditor.editor.hideEditor();
                }
            }
        }
        
        // Save session
        this.saveSession();
    }
    
    /**
     * Save the active tab
     */
    saveActiveTab() {
        if (!this.activeTab) return;
        
        this.saveTab(this.activeTab);
    }
    
    /**
     * Save a tab
     * @param {Object} tab - Tab object to save
     */
    saveTab(tab) {
        if (!tab) return;
        
        // Get content from editor
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            tab.content = window.slimCodeEditor.editor.getContent();
            tab.modified = false;
            
            // Update tab appearance
            this.updateTabAppearance(tab);
            
            // Save file to storage
            if (window.slimCodeEditor && window.slimCodeEditor.fileExplorer) {
                window.slimCodeEditor.fileExplorer.saveFile(tab.path, tab.content);
            }
            
            // Show notification
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'File Saved',
                    message: `${tab.path.split('/').pop()} has been saved.`,
                    type: 'success'
                });
            }
        }
        
        // Save session
        this.saveSession();
    }
    
    /**
     * Mark the active tab as modified
     */
    markActiveTabAsModified() {
        if (!this.activeTab) return;
        
        // Get content from editor
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            const currentContent = window.slimCodeEditor.editor.getContent();
            
            // Check if content has changed
            if (currentContent !== this.activeTab.content) {
                this.activeTab.modified = true;
                this.updateTabAppearance(this.activeTab);
            }
        }
    }
    
    /**
     * Update tab appearance based on its state
     * @param {Object} tab - Tab object to update
     */
    updateTabAppearance(tab) {
        if (!tab || !tab.element) return;
        
        const tabName = tab.element.querySelector('.tab-name');
        if (tabName) {
            // Add/remove modified indicator
            if (tab.modified) {
                if (!tabName.textContent.startsWith('* ')) {
                    tabName.textContent = '* ' + tabName.textContent;
                }
            } else {
                tabName.textContent = tabName.textContent.replace('* ', '');
            }
        }
    }
    
    /**
     * Find a tab by file path
     * @param {string} path - File path to find
     * @returns {Object|null} Tab object if found, null otherwise
     */
    findTabByPath(path) {
        return this.tabs.find(tab => tab.path === path) || null;
    }
    
    /**
     * Get language from file extension
     * @param {string} extension - File extension
     * @returns {string} Language identifier for Monaco editor
     */
    getLanguageFromExtension(extension) {
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'java': 'java',
            'cs': 'csharp',
            'cpp': 'cpp',
            'c': 'cpp',
            'h': 'cpp',
            'php': 'php',
            'txt': 'plaintext'
        };
        
        return languageMap[extension] || 'plaintext';
    }
    
    /**
     * Save tabs session to localStorage
     */
    saveSession() {
        const session = {
            tabs: this.tabs.map(tab => ({
                path: tab.path,
                content: tab.content,
                language: tab.language,
                modified: tab.modified
            })),
            activeTabIndex: this.activeTab ? this.tabs.indexOf(this.activeTab) : -1
        };
        
        localStorage.setItem('slim-code-editor-tabs-session', JSON.stringify(session));
    }
    
    /**
     * Load tabs session from localStorage
     */
    loadSession() {
        const sessionData = localStorage.getItem('slim-code-editor-tabs-session');
        if (!sessionData) return;
        
        try {
            const session = JSON.parse(sessionData);
            
            // Recreate tabs
            session.tabs.forEach(tabData => {
                const file = {
                    path: tabData.path,
                    content: tabData.content
                };
                
                const tab = this.createTab(file);
                const tabObj = this.findTabByPath(tabData.path);
                
                if (tabObj) {
                    tabObj.modified = tabData.modified;
                    this.updateTabAppearance(tabObj);
                }
            });
            
            // Activate the previously active tab
            if (session.activeTabIndex !== -1 && session.activeTabIndex < this.tabs.length) {
                this.activateTab(this.tabs[session.activeTabIndex]);
            }
        } catch (error) {
            console.error('Error loading tabs session:', error);
        }
    }
}