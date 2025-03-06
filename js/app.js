// Initialize all modules
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

// Make modules available globally
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
    activityBar,
    statusBar,
    debugManager
};

// Initialize UI components
initWelcomeScreen();
registerKeyboardShortcuts();

// Load user preferences
loadUserPreferences();

console.log('slim code. initialized');

/**
 * Initialize welcome screen
 */
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
            
            // Focus the input
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
    
    // Load recent projects
    loadRecentProjects();
}

/**
 * Load recent projects
 */
function loadRecentProjects() {
    const recentProjectsContainer = document.querySelector('.recent-projects');
    if (!recentProjectsContainer) return;
    
    const lastProject = localStorage.getItem('slim-code-editor-last-project');
    if (lastProject) {
        try {
            const projectData = JSON.parse(lastProject);
            
            // Clear container
            recentProjectsContainer.innerHTML = '';
            
            // Create project item
            const projectItem = document.createElement('div');
            projectItem.className = 'recent-project flex items-center p-2 hover:bg-editor-highlight/50 rounded-lg cursor-pointer';
            projectItem.innerHTML = `
                <span class="material-icons mr-2">folder</span>
                <span>${projectData.name}</span>
            `;
            
            // Add click event
            projectItem.addEventListener('click', () => {
                window.slimCodeEditor.fileExplorer.openProject(projectData.name, projectData.fileSystem);
            });
            
            recentProjectsContainer.appendChild(projectItem);
        } catch (error) {
            console.error('Error loading recent projects:', error);
        }
    }
}

/**
 * Register keyboard shortcuts
 */
function registerKeyboardShortcuts() {
    // Ctrl+S: Save file
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            window.slimCodeEditor.tabs.saveActiveTab();
        }
    });

    // Ctrl+N: New file
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.slimCodeEditor.fileExplorer.createNewFile();
        }
    });

    // Ctrl+F: Find
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            window.slimCodeEditor.editor.showFindWidget();
        }
    });

    // Ctrl+Shift+P: Command palette
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
            e.preventDefault();
            window.slimCodeEditor.editor.showCommandPalette();
        }
    });
    
    // Ctrl+W: Close tab
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
            e.preventDefault();
            if (window.slimCodeEditor.tabs.activeTab) {
                window.slimCodeEditor.tabs.closeTab(window.slimCodeEditor.tabs.activeTab);
            }
        }
    });
    
    // Ctrl+O: Open folder
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            window.slimCodeEditor.fileExplorer.openFolder();
        }
    });
}

/**
 * Load user preferences
 */
function loadUserPreferences() {
    // Wait for editor to be ready
    window.addEventListener('editorReady', () => {
        // Load theme
        const savedTheme = localStorage.getItem('slim-code-editor-theme') || 'vs-dark';
        const themeSelect = document.querySelector('.theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
            window.slimCodeEditor.editor.setTheme(savedTheme);
            
            // Add event listener
            themeSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setTheme(themeSelect.value);
            });
        }
    
        // Load font size
        const savedFontSize = localStorage.getItem('slim-code-editor-font-size') || '14';
        const fontSizeSelect = document.querySelector('.font-size-select');
        if (fontSizeSelect) {
            fontSizeSelect.value = savedFontSize;
            window.slimCodeEditor.editor.setFontSize(parseInt(savedFontSize));
            
            // Add event listener
            fontSizeSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setFontSize(parseInt(fontSizeSelect.value));
            });
        }
    
        // Load word wrap
        const savedWordWrap = localStorage.getItem('slim-code-editor-word-wrap') || 'off';
        const wordWrapSelect = document.querySelector('.word-wrap-select');
        if (wordWrapSelect) {
            wordWrapSelect.value = savedWordWrap;
            window.slimCodeEditor.editor.setWordWrap(savedWordWrap);
            
            // Add event listener
            wordWrapSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setWordWrap(wordWrapSelect.value);
            });
        }
    
        // Load tab size
        const savedTabSize = localStorage.getItem('slim-code-editor-tab-size') || '4';
        const tabSizeSelect = document.querySelector('.tab-size-select');
        if (tabSizeSelect) {
            tabSizeSelect.value = savedTabSize;
            window.slimCodeEditor.editor.setTabSize(parseInt(savedTabSize));
            
            // Add event listener
            tabSizeSelect.addEventListener('change', () => {
                window.slimCodeEditor.editor.setTabSize(parseInt(tabSizeSelect.value));
            });
        }
    });
} 