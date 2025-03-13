const editor = new Editor();
const sidebar = new Sidebar();
const fileExplorer = new FileExplorer();
const tabs = new Tabs();
const search = new Search();
const notes = new Notes();
const settings = new Settings();
const statusBar = new StatusBar();
const notifications = new NotificationManager();
const modal = new ModalManager();
const activityBar = new ActivityBar();
const debugManager = new DebugManager();
const githubManager = new GitHubManager();
window.slimCodeEditor = {
    editor,
    sidebar,
    fileExplorer,
    tabs,
    search,
    notes,
    settings,
    notifications,
    modal,
    modalManager: modal,
    activityBar,
    statusBar,
    debugManager,
    githubManager
};
checkEmbedModeParameters();
initWelcomeScreen();
registerKeyboardShortcuts();
loadUserPreferences();
console.log('slim code. initialized');
function checkEmbedModeParameters() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('file')) {
        const filePath = params.get('file');
        if (filePath) {
            setTimeout(() => {
                fileExplorer.openFile(filePath);
                notifications.show('info', `Opened file from embed mode: ${filePath}`);
            }, 500);
        }
    }
    if (params.has('github')) {
        const repo = params.get('github');
        const path = params.get('path') || '';
        if (repo) {
            setTimeout(async () => {
                if (!githubManager.isAuthenticated) {
                    notifications.show('info', 'Please connect to GitHub to access the repository');
                    activityBar.activatePanel('github');
                } else {
                    try {
                        const [owner, repoName] = repo.split('/');
                        if (owner && repoName) {
                            await githubManager.cloneRepository(owner, repoName);
                            if (path) {
                                setTimeout(() => {
                                    fileExplorer.openFile(path);
                                }, 1000);
                            }
                            notifications.show('success', `Opened GitHub repository: ${repo}`);
                        }
                    } catch (error) {
                        notifications.show('error', `Failed to open GitHub repository: ${error.message}`);
                    }
                }
            }, 1000);
        }
    }
    if (params.has('gist')) {
        const gistId = params.get('gist');
        const file = params.get('file') || '';
        if (gistId) {
            setTimeout(async () => {
                if (!githubManager.isAuthenticated) {
                    notifications.show('info', 'Please connect to GitHub to access the Gist');
                    activityBar.activatePanel('github');
                } else {
                    try {
                        await githubManager.openGist(gistId, file);
                        notifications.show('success', `Opened GitHub Gist: ${gistId}`);
                    } catch (error) {
                        notifications.show('error', `Failed to open GitHub Gist: ${error.message}`);
                    }
                }
            }, 1000);
        }
    }
}
function initWelcomeScreen() {
    const newProjectBtn = document.querySelector('.start-option:nth-child(1)');
    const openFolderBtn = document.querySelector('.start-option:nth-child(2)');
    const newFileBtn = document.querySelector('.start-option:nth-child(3)');
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            window.slimCodeEditor.modal.show({
                title: 'Create New Project',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Project Name</label>
                            <input type="text" id="project-name" class="w-full" placeholder="My Project">
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Project Type</label>
                            <select id="project-type" class="w-full">
                                <option value="empty">Empty Project</option>
                                <option value="web">Web Application</option>
                                <option value="node">Node.js Application</option>
                            </select>
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    const projectName = document.getElementById('project-name').value;
                    const projectType = document.getElementById('project-type').value;
                    if (projectName) {
                        window.slimCodeEditor.fileExplorer.createProject(projectName, projectType);
                    }
                }
            });
            setTimeout(() => {
                const input = document.getElementById('project-name');
                if (input) input.focus();
            }, 100);
        });
    }
    if (openFolderBtn) {
        openFolderBtn.addEventListener('click', () => {
            window.slimCodeEditor.fileExplorer.openFolder();
        });
    }
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            window.slimCodeEditor.fileExplorer.createNewFile();
        });
    }
    loadRecentProjects();
}
function loadRecentProjects() {
    const recentProjectsContainer = document.querySelector('.recent-projects');
    if (!recentProjectsContainer) return;
    const lastProject = localStorage.getItem('slim-code-editor-last-project');
    if (lastProject) {
        try {
            const projectData = JSON.parse(lastProject);
            recentProjectsContainer.innerHTML = '';
            const projectItem = document.createElement('div');
            projectItem.className = 'recent-project flex items-center p-2 hover:bg-editor-highlight/50 rounded-lg cursor-pointer';
            projectItem.innerHTML = `
                <span class="material-icons mr-2">folder</span>
                <span>${projectData.name}</span>
            `;
            projectItem.addEventListener('click', () => {
                window.slimCodeEditor.fileExplorer.openProject(projectData.name, projectData.fileSystem);
            });
            recentProjectsContainer.appendChild(projectItem);
        } catch (error) {
            console.error('Error loading recent projects:', error);
        }
    }
}
function registerKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            window.slimCodeEditor.tabs.saveActiveTab();
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.slimCodeEditor.fileExplorer.createNewFile();
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            window.slimCodeEditor.editor.showFindWidget();
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
            e.preventDefault();
            window.slimCodeEditor.editor.showCommandPalette();
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
            e.preventDefault();
            if (window.slimCodeEditor.tabs.activeTab) {
                window.slimCodeEditor.tabs.closeTab(window.slimCodeEditor.tabs.activeTab);
            }
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            window.slimCodeEditor.fileExplorer.openFolder();
        }
    });
}
function loadUserPreferences() {
    window.addEventListener('editorReady', () => {
        const savedTheme = localStorage.getItem('slim-code-editor-theme') || 'vs-dark';
        const themeSelect = document.querySelector('.theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
            window.slimCodeEditor.editor.setTheme(savedTheme);
            themeSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setTheme(themeSelect.value);
            });
        }
        const savedFontSize = localStorage.getItem('slim-code-editor-font-size') || '14';
        const fontSizeSelect = document.querySelector('.font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.value = savedFontSize;
            window.slimCodeEditor.editor.setFontSize(parseInt(savedFontSize));
            fontSizeSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setFontSize(parseInt(fontSizeSelect.value));
            });
        }
        const savedWordWrap = localStorage.getItem('slim-code-editor-word-wrap') || 'off';
        const wordWrapSelect = document.querySelector('.word-wrap-select');
        if (wordWrapSelect) {
            wordWrapSelect.value = savedWordWrap;
            window.slimCodeEditor.editor.setWordWrap(savedWordWrap);
            wordWrapSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setWordWrap(wordWrapSelect.value);
            });
        }
        const savedTabSize = localStorage.getItem('slim-code-editor-tab-size') || '4';
        const tabSizeSelect = document.querySelector('.tab-size-select');
        if (tabSizeSelect) {
            tabSizeSelect.value = savedTabSize;
            window.slimCodeEditor.editor.setTabSize(parseInt(savedTabSize));
            tabSizeSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setTabSize(parseInt(tabSizeSelect.value));
            });
        }
    });
}
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

