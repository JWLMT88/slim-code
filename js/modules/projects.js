class Projects {
    constructor() {
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.editor = document.getElementById('monaco-editor');
        this.sidebar = document.querySelector('aside');
        this.recentProjectsContainer = document.getElementById('recent-projects');
        this.currentProject = null;
        this.recentProjects = this.loadRecentProjects();
        window.projects = this;
        this.init();
        
        // Initially hide sidebar when welcome screen is visible
        if (!this.welcomeScreen.classList.contains('hidden')) {
            this.sidebar.classList.add('hidden');
        }
    }


    init() {
        this.initEventListeners();
        this.renderRecentProjects();
        this.checkLastSession();
    }

    initEventListeners() {
        // New Project Form
        document.getElementById('new-project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewProject();
        });

        // Quick Action Buttons
        document.getElementById('open-folder-btn').addEventListener('click', () => {
            // TODO: Implement folder open dialog
            this.showNotification('Coming Soon', 'This feature will be available soon!');
        });

        document.getElementById('clone-repo-btn').addEventListener('click', () => {
            // TODO: Implement repository clone
            this.showNotification('Coming Soon', 'This feature will be available soon!');
        });
    }

    loadRecentProjects() {
        return getFromLocalStorage('recentProjects', []);
    }

    renderRecentProjects() {
        this.recentProjectsContainer.innerHTML = '';
        
        this.recentProjects.slice(0, 4).forEach(project => {
            const projectCard = createElement('div', 'bg-gray-800 rounded-lg p-4 hover:bg-gray-700 cursor-pointer transition-colors');
            projectCard.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold">${project.name}</h3>
                    <span class="material-icons text-sm text-gray-400">${this.getProjectIcon(project.type)}</span>
                </div>
                <p class="text-sm text-gray-400">${project.type}</p>
                <p class="text-xs text-gray-500 mt-2">Last opened: ${new Date(project.lastOpened).toLocaleDateString()}</p>
            `;
            
            projectCard.addEventListener('click', () => this.openProject(project));
            this.recentProjectsContainer.appendChild(projectCard);
        });
    }

    getProjectIcon(type) {
        const icons = {
            web: 'web',
            static: 'html',
            node: 'code',
            react: 'grain',
            vue: 'change_history',
            empty: 'folder'
        };
        return icons[type] || 'folder';
    }

    createNewProject() {
        const name = document.getElementById('project-name').value.trim();
        const type = document.getElementById('project-type').value;
        
        if (!name) {
            this.showNotification('Error', 'Please enter a project name', 'error');
            return;
        }

        const project = {
            id: Date.now().toString(),
            name,
            type,
            created: Date.now(),
            lastOpened: Date.now()
        };

        // Create project structure
        const structure = this.getProjectStructure(project);
        window.explorer.fileSystem = structure;
        saveToLocalStorage('fileSystem', structure);

        // Update recent projects
        this.recentProjects.unshift(project);
        this.recentProjects = this.recentProjects.slice(0, 10); // Keep only 10 recent projects
        saveToLocalStorage('recentProjects', this.recentProjects);

        // Open project
        this.openProject(project);
    }

    getProjectStructure(project) {
        const structures = {
            web: {
                src: {
                    type: 'directory',
                    children: {
                        'index.html': {
                            type: 'file',
                            icon: 'html',
                            content: this.getTemplateContent('web', 'index.html', project.name)
                        },
                        'styles': {
                            type: 'directory',
                            children: {
                                'main.css': {
                                    type: 'file',
                                    icon: 'css',
                                    content: this.getTemplateContent('web', 'main.css')
                                }
                            }
                        },
                        'scripts': {
                            type: 'directory',
                            children: {
                                'app.js': {
                                    type: 'file',
                                    icon: 'javascript',
                                    content: this.getTemplateContent('web', 'app.js')
                                }
                            }
                        }
                    }
                }
            },
        };

        return structures[project.type] || {
            src: {
                type: 'directory',
                children: {}
            }
        };
    }

    getTemplateContent(type, file, projectName = '') {
        const templates = {
            web: {
                'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
    <h1>Welcome to ${projectName}</h1>
    <script src="scripts/app.js"></script>
</body>
</html>`,
                'main.css': `body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
}

h1 {
    color: #333;
}`,
                'app.js': `// ${projectName} - Main Application Code
document.addEventListener('DOMContentLoaded', () => {
    console.log('Application initialized');
});`
            }
        };

        return templates[type]?.[file] || '';
    }

    async openProject(project) {
        this.currentProject = project;
        project.lastOpened = Date.now();
        saveToLocalStorage('recentProjects', this.recentProjects);

        const brandingTitle = document.querySelector('.branding h1');
        if (brandingTitle) {
            brandingTitle.textContent = project.name;
        }
        
        this.sidebar.classList.remove('hidden');
        this.welcomeScreen.classList.add('hidden');
        this.editor.classList.remove('hidden');
        document.getElementById('explorer-title').textContent = project.name;

        window.explorer.refresh();
    }

    async checkLastSession() {
        const session = getFromLocalStorage('lastSession', null);
        if (session) {
            const project = this.recentProjects.find(p => p.id === session.projectId);
            if (project) {
                await this.openProject(project);
                setTimeout(async () => {
                    if (window.editor) {
                        await window.editor.initPromise;
                        await window.editor.restoreSession(session);
                    }
                }, 20);
            
            } else {
                this.sidebar.classList.add('hidden');
            }
        } else {
            this.sidebar.classList.add('hidden');
        }
    }


    saveSession() {
        const session = {
            projectId: this.currentProject.id,
            openTabs: Array.from(window.tabs.tabs.keys()).map(path => ({
                path,
                content: window.tabs.getLatestContent(path)
            })),
            activeTab: window.tabs.activeTab
        };
        saveToLocalStorage('lastSession', session);
    }

    showNotification(title, message, type = 'info') {
        window.app.showNotification(title, message, type);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new Projects();
});