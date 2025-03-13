class Tabs {
    constructor() {
        this.container = document.querySelector('.tabs-container');
        this.tabs = [];
        this.activeTab = null;
        this.init();
    }
    init() {
        if (!this.container) return;
        this.loadSession();
    }
    createTab(file) {
        if (!this.container) return null;
        const existingTab = this.findTabByPath(file.path);
        if (existingTab) {
            this.activateTab(existingTab);
            return existingTab.element;
        }
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.setAttribute('data-path', file.path);
        const fileName = file.path.split('/').pop();
        const extension = fileName.split('.').pop().toLowerCase();
        const language = this.getLanguageFromExtension(extension);
        tab.innerHTML = `
            <span class="tab-name">${fileName}</span>
            <button class="tab-close">
                <span class="material-icons text-xs">close</span>
            </button>
        `;
        this.container.appendChild(tab);
        const tabObj = {
            element: tab,
            path: file.path,
            content: file.content,
            language,
            modified: false
        };
        this.tabs.push(tabObj);
        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                this.activateTab(tabObj);
            }
        });
        tab.querySelector('.tab-close').addEventListener('click', () => {
            this.closeTab(tabObj);
        });
        this.activateTab(tabObj);
        return tab;
    }
    activateTab(tab) {
        if (!tab) return;
        if (this.activeTab) {
            this.activeTab.element.classList.remove('active');
        }
        tab.element.classList.add('active');
        this.activeTab = tab;
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            window.slimCodeEditor.editor.setContent(tab.content, tab.language);
        }
        this.saveSession();
    }
    closeTab(tab) {
        if (!tab) return;
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
    removeTab(tab) {
        if (!tab) return;
        tab.element.remove();
        const index = this.tabs.indexOf(tab);
        if (index !== -1) {
            this.tabs.splice(index, 1);
        }
        if (this.activeTab === tab) {
            this.activeTab = null;
            if (this.tabs.length > 0) {
                const newIndex = Math.min(index, this.tabs.length - 1);
                this.activateTab(this.tabs[newIndex]);
            } else {
                if (window.slimCodeEditor && window.slimCodeEditor.editor) {
                    window.slimCodeEditor.editor.hideEditor();
                }
            }
        }
        this.saveSession();
    }
    saveActiveTab() {
        if (!this.activeTab) return;
        this.saveTab(this.activeTab);
    }
    saveTab(tab) {
        if (!tab) return;
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            tab.content = window.slimCodeEditor.editor.getContent();
            tab.modified = false;
            this.updateTabAppearance(tab);
            if (window.slimCodeEditor && window.slimCodeEditor.fileExplorer) {
                window.slimCodeEditor.fileExplorer.saveFile(tab.path, tab.content);
            }
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'File Saved',
                    message: `${tab.path.split('/').pop()} has been saved.`,
                    type: 'success'
                });
            }
        }
        this.saveSession();
    }
    markActiveTabAsModified() {
        if (!this.activeTab) return;
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            const currentContent = window.slimCodeEditor.editor.getContent();
            if (currentContent !== this.activeTab.content) {
                this.activeTab.modified = true;
                this.updateTabAppearance(this.activeTab);
            }
        }
    }
    updateTabAppearance(tab) {
        if (!tab || !tab.element) return;
        const tabName = tab.element.querySelector('.tab-name');
        if (tabName) {
            if (tab.modified) {
                if (!tabName.textContent.startsWith('* ')) {
                    tabName.textContent = '* ' + tabName.textContent;
                }
            } else {
                tabName.textContent = tabName.textContent.replace('* ', '');
            }
        }
    }
    findTabByPath(path) {
        return this.tabs.find(tab => tab.path === path) || null;
    }
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
    loadSession() {
        const sessionData = localStorage.getItem('slim-code-editor-tabs-session');
        if (!sessionData) return;
        try {
            const session = JSON.parse(sessionData);
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
            if (session.activeTabIndex !== -1 && session.activeTabIndex < this.tabs.length) {
                this.activateTab(this.tabs[session.activeTabIndex]);
            }
        } catch (error) {
            console.error('Error loading tabs session:', error);
        }
    }
}

