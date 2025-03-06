/**
 * FileExplorer Class
 * Manages the file explorer functionality
 */
class FileExplorer {
    constructor() {
        this.container = document.querySelector('.file-tree');
        this.currentProject = null;
        this.fileSystem = {};
        
        this.init();
    }
    
    /**
     * Initialize file explorer
     */
    init() {
        if (!this.container) {
            console.error('File explorer container not found');
            return;
        }
        
        // Initialize event listeners for file explorer buttons
        this.initEventListeners();
        
        // Load last project if available
        this.loadLastProject();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // New file button
        const newFileBtn = document.querySelector('.panel-header [title="New File"]');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => this.createNewFile());
        }
        
        // New folder button
        const newFolderBtn = document.querySelector('.panel-header [title="New Folder"]');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNewFolder());
        }
        
        // Refresh button
        const refreshBtn = document.querySelector('.panel-header [title="Refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshFileTree());
        }
        
        // Listen for tab close events to update file tree
        window.addEventListener('tabClosed', (e) => {
            if (e.detail && e.detail.path) {
                this.refreshFileTree();
            }
        });
    }
    
    /**
     * Load the last opened project
     */
    loadLastProject() {
        const lastProject = localStorage.getItem('slim-code-editor-last-project');
        if (lastProject) {
            try {
                const projectData = JSON.parse(lastProject);
                this.openProject(projectData.name, projectData.fileSystem);
                
                // Show notification
                if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                    window.slimCodeEditor.notifications.show({
                        title: 'Project Loaded',
                        message: `Project "${projectData.name}" has been loaded.`,
                        type: 'info'
                    });
                }
            } catch (error) {
                console.error('Error loading last project:', error);
            }
        }
    }
    
    /**
     * Create a new project
     * @param {string} name - Project name
     * @param {string} type - Project type
     */
    createProject(name, type) {
        if (!name) return;
        
        // Create project file system
        const fileSystem = this.createProjectTemplate(name, type);
        
        // Open the project
        this.openProject(name, fileSystem);
        
        // Show notification
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'Project Created',
                message: `Project "${name}" has been created.`,
                type: 'success'
            });
        }
    }
    
    /**
     * Create project template based on type
     * @param {string} name - Project name
     * @param {string} type - Project type
     * @returns {Object} Project file system
     */
    createProjectTemplate(name, type) {
        const fileSystem = {
            type: 'folder',
            name,
            children: []
        };
        
        switch (type) {
            case 'web':
                // Web application template
                fileSystem.children = [
                    {
                        type: 'file',
                        name: 'index.html',
                        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <h1>${name}</h1>
    <p>Welcome to your new web project!</p>
    
    <script src="js/main.js"></script>
</body>
</html>`
                    },
                    {
                        type: 'folder',
                        name: 'css',
                        children: [
                            {
                                type: 'file',
                                name: 'styles.css',
                                content: `/* Styles for ${name} */
body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    color: #333;
}

h1 {
    color: #0066cc;
}`
                            }
                        ]
                    },
                    {
                        type: 'folder',
                        name: 'js',
                        children: [
                            {
                                type: 'file',
                                name: 'main.js',
                                content: `// Main JavaScript for ${name}
document.addEventListener('DOMContentLoaded', () => {
    console.log('${name} application loaded');
});`
                            }
                        ]
                    }
                ];
                break;
                
            case 'node':
                // Node.js application template
                fileSystem.children = [
                    {
                        type: 'file',
                        name: 'package.json',
                        content: `{
  "name": "${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "version": "1.0.0",
  "description": "${name} - Node.js application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}`
                    },
                    {
                        type: 'file',
                        name: 'index.js',
                        content: `// Main entry point for ${name}
console.log('${name} application started');

// Example HTTP server
const http = require('http');

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, World!\\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(\`Server running at http://localhost:\${PORT}/\`);
});`
                    },
                    {
                        type: 'file',
                        name: '.gitignore',
                        content: `# Node.js specific
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
package-lock.json

# Environment variables
.env

# Logs
logs/
*.log

# OS specific
.DS_Store
Thumbs.db`
                    },
                    {
                        type: 'file',
                        name: 'README.md',
                        content: `# ${name}

A Node.js application.

## Getting Started

1. Clone this repository
2. Run \`npm install\`
3. Run \`npm start\`

## License

ISC`
                    }
                ];
                break;
                
            default:
                // Empty project
                fileSystem.children = [
                    {
                        type: 'file',
                        name: 'README.md',
                        content: `# ${name}

Welcome to your new project!`
                    }
                ];
                break;
        }
        
        return fileSystem;
    }
    
    /**
     * Open a project
     * @param {string} name - Project name
     * @param {Object} fileSystem - Project file system
     */
    openProject(name, fileSystem) {
        this.currentProject = {
            name,
            fileSystem
        };
        
        // Render file tree
        this.renderFileTree();
        
        // Save as last project
        localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('projectOpened', {
            detail: {
                name,
                fileSystem
            }
        }));
    }
    
    /**
     * Open a folder
     */
    openFolder() {
        // In a real application, this would open a file dialog
        // For this demo, we'll create a sample project
        
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.show({
                title: 'Open Folder',
                body: `
                    <p class="mb-4">In a real application, this would open a file dialog.</p>
                    <p>For this demo, we'll create a sample project:</p>
                    <div class="space-y-2 mt-4">
                        <label class="text-xs text-editor-text-muted">Project Name</label>
                        <input type="text" id="sample-project-name" class="w-full" value="Sample Project">
                    </div>
                `,
                onConfirm: () => {
                    const projectName = document.getElementById('sample-project-name').value || 'Sample Project';
                    this.createProject(projectName, 'web');
                }
            });
        } else {
            const projectName = prompt('Enter project name:', 'Sample Project');
            if (projectName) {
                this.createProject(projectName, 'web');
            }
        }
    }
    
    /**
     * Render the file tree
     */
    renderFileTree() {
        if (!this.container || !this.currentProject) return;
        
        // Clear container
        this.container.innerHTML = '';
        
        // Render root folder
        this.renderFolder(this.currentProject.fileSystem, this.container, '');
    }
    
    /**
     * Render a folder in the file tree
     * @param {Object} folder - Folder object
     * @param {HTMLElement} container - Container element
     * @param {string} path - Current path
     */
    renderFolder(folder, container, path) {
        const folderPath = path ? `${path}/${folder.name}` : folder.name;
        
        // Create folder item
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.dataset.path = folderPath;
        
        // Create folder name element
        const folderNameEl = document.createElement('div');
        folderNameEl.className = 'folder-name';
        folderNameEl.innerHTML = `
            <span class="material-icons text-editor-text-muted mr-1">folder</span>
            <span>${folder.name}</span>
        `;
        
        folderItem.appendChild(folderNameEl);
        
        // Create folder children container
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'folder-children hidden';
        
        // Add click event to toggle folder
        folderNameEl.addEventListener('click', () => {
            const isOpen = !childrenContainer.classList.contains('hidden');
            
            // Toggle folder icon
            const folderIcon = folderNameEl.querySelector('.material-icons');
            folderIcon.textContent = isOpen ? 'folder' : 'folder_open';
            
            // Toggle children visibility
            childrenContainer.classList.toggle('hidden');
        });
        
        // Add folder to container
        container.appendChild(folderItem);
        container.appendChild(childrenContainer);
        
        // Render children
        if (folder.children && folder.children.length > 0) {
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    this.renderFolder(child, childrenContainer, folderPath);
                } else {
                    this.renderFile(child, childrenContainer, folderPath);
                }
            });
        }
    }
    
    /**
     * Render a file in the file tree
     * @param {Object} file - File object
     * @param {HTMLElement} container - Container element
     * @param {string} path - Current path
     */
    renderFile(file, container, path) {
        const filePath = `${path}/${file.name}`;
        
        // Create file item
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.path = filePath;
        
        // Get file icon based on extension
        const extension = file.name.split('.').pop().toLowerCase();
        const icon = this.getFileIcon(extension);
        
        fileItem.innerHTML = `
            <span class="material-icons text-editor-text-muted mr-1">${icon}</span>
            <span>${file.name}</span>
        `;
        
        // Add click event to open file
        fileItem.addEventListener('click', () => {
            this.openFile(filePath);
        });
        
        // Add context menu event
        fileItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Show context menu
            if (window.slimCodeEditor && window.slimCodeEditor.modal) {
                window.slimCodeEditor.modal.show({
                    title: 'File Options',
                    body: `
                        <div class="space-y-2">
                            <button id="rename-file" class="w-full text-left p-2 hover:bg-editor-highlight rounded">
                                <span class="material-icons text-sm mr-2">edit</span>
                                Rename
                            </button>
                            <button id="delete-file" class="w-full text-left p-2 hover:bg-editor-highlight rounded">
                                <span class="material-icons text-sm mr-2">delete</span>
                                Delete
                            </button>
                        </div>
                    `,
                    onConfirm: () => {
                        // Do nothing on confirm
                    }
                });
                
                // Add event listeners to buttons
                document.getElementById('rename-file').addEventListener('click', () => {
                    window.slimCodeEditor.modal.hide();
                    this.renameFile(filePath);
                });
                
                document.getElementById('delete-file').addEventListener('click', () => {
                    window.slimCodeEditor.modal.hide();
                    this.deleteFile(filePath);
                });
            }
        });
        
        // Add file to container
        container.appendChild(fileItem);
    }
    
    /**
     * Get file icon based on extension
     * @param {string} extension - File extension
     * @returns {string} Material icon name
     */
    getFileIcon(extension) {
        const icons = {
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'json': 'code',
            'md': 'description',
            'txt': 'text_snippet',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'svg': 'image',
            'pdf': 'picture_as_pdf'
        };
        
        return icons[extension] || 'description';
    }
    
    /**
     * Open a file
     * @param {string} path - File path
     */
    openFile(path) {
        // Find file in file system
        const file = this.findFileByPath(path);
        
        if (file) {
            // Create tab for file
            if (window.slimCodeEditor && window.slimCodeEditor.tabs) {
                window.slimCodeEditor.tabs.createTab({
                    path,
                    content: file.content
                });
            }
            
            // Highlight file in file tree
            this.highlightFile(path);
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('fileOpened', {
                detail: {
                    path,
                    content: file.content,
                    language: this.getLanguageFromExtension(path.split('.').pop().toLowerCase())
                }
            }));
        }
    }
    
    /**
     * Get language from file extension
     * @param {string} extension - File extension
     * @returns {string} Language identifier
     */
    getLanguageFromExtension(extension) {
        const languages = {
            'js': 'javascript',
            'ts': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'json': 'json',
            'md': 'markdown',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'php': 'php',
            'rb': 'ruby',
            'rs': 'rust',
            'swift': 'swift',
            'sh': 'shell',
            'sql': 'sql',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml'
        };
        
        return languages[extension] || 'plaintext';
    }
    
    /**
     * Highlight a file in the file tree
     * @param {string} path - File path
     */
    highlightFile(path) {
        // Remove highlight from all files
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => item.classList.remove('active'));
        
        // Add highlight to selected file
        const fileItem = document.querySelector(`.file-item[data-path="${path}"]`);
        if (fileItem) {
            fileItem.classList.add('active');
            
            // Ensure file is visible (expand parent folders)
            let parent = fileItem.parentElement;
            while (parent && parent.classList.contains('folder-children')) {
                parent.classList.remove('hidden');
                
                // Update folder icon
                const folderItem = parent.previousElementSibling;
                if (folderItem && folderItem.classList.contains('folder-item')) {
                    const folderIcon = folderItem.querySelector('.material-icons');
                    if (folderIcon) {
                        folderIcon.textContent = 'folder_open';
                    }
                }
                
                parent = parent.parentElement.parentElement;
            }
        }
    }
    
    /**
     * Find file by path
     * @param {string} path - File path
     * @returns {Object|null} File object or null if not found
     */
    findFileByPath(path) {
        if (!this.currentProject) return null;
        
        const parts = path.split('/');
        let current = this.currentProject.fileSystem;
        
        // Skip root folder name
        for (let i = 1; i < parts.length; i++) {
            if (current.type === 'folder' && current.children) {
                const found = current.children.find(child => child.name === parts[i]);
                if (found) {
                    current = found;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }
        
        return current.type === 'file' ? current : null;
    }
    
    /**
     * Save a file
     * @param {string} path - File path
     * @param {string} content - File content
     */
    saveFile(path, content) {
        if (!this.currentProject) return;
        
        const file = this.findFileByPath(path);
        if (file) {
            file.content = content;
            
            // Save project
            localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
            
            // Show notification
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'File Saved',
                    message: `File "${path.split('/').pop()}" has been saved.`,
                    type: 'success'
                });
            }
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('fileSaved', {
                detail: {
                    path,
                    content
                }
            }));
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Create a new file
     */
    createNewFile() {
        if (!this.currentProject) {
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'No Project Open',
                    message: 'Please open or create a project first.',
                    type: 'warning'
                });
            }
            return;
        }
        
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.show({
                title: 'Create New File',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">File Name</label>
                            <input type="text" id="new-file-name" class="w-full" placeholder="example.js">
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    const fileName = document.getElementById('new-file-name').value;
                    if (fileName) {
                        this.addFile(fileName, '');
                    }
                }
            });
            
            // Focus the input
            setTimeout(() => {
                const input = document.getElementById('new-file-name');
                if (input) input.focus();
            }, 100);
        } else {
            const fileName = prompt('Enter file name:');
            if (fileName) {
                this.addFile(fileName, '');
            }
        }
    }
    
    /**
     * Create a new folder
     */
    createNewFolder() {
        if (!this.currentProject) {
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'No Project Open',
                    message: 'Please open or create a project first.',
                    type: 'warning'
                });
            }
            return;
        }
        
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.show({
                title: 'Create New Folder',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Folder Name</label>
                            <input type="text" id="new-folder-name" class="w-full" placeholder="my-folder">
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    const folderName = document.getElementById('new-folder-name').value;
                    if (folderName) {
                        this.addFolder(folderName);
                    }
                }
            });
            
            // Focus the input
            setTimeout(() => {
                const input = document.getElementById('new-folder-name');
                if (input) input.focus();
            }, 100);
        } else {
            const folderName = prompt('Enter folder name:');
            if (folderName) {
                this.addFolder(folderName);
            }
        }
    }
    
    /**
     * Add a file to the project
     * @param {string} name - File name
     * @param {string} content - File content
     */
    addFile(name, content) {
        if (!this.currentProject) return;
        
        // Add file to root folder
        this.currentProject.fileSystem.children.push({
            type: 'file',
            name,
            content
        });
        
        // Refresh file tree
        this.renderFileTree();
        
        // Save project
        localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
        
        // Open the new file
        const path = `${this.currentProject.fileSystem.name}/${name}`;
        this.openFile(path);
        
        // Show notification
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'File Created',
                message: `File "${name}" has been created.`,
                type: 'success'
            });
        }
    }
    
    /**
     * Add a folder to the project
     * @param {string} name - Folder name
     */
    addFolder(name) {
        if (!this.currentProject) return;
        
        // Add folder to root folder
        this.currentProject.fileSystem.children.push({
            type: 'folder',
            name,
            children: []
        });
        
        // Refresh file tree
        this.renderFileTree();
        
        // Save project
        localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
        
        // Show notification
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'Folder Created',
                message: `Folder "${name}" has been created.`,
                type: 'success'
            });
        }
    }
    
    /**
     * Rename a file
     * @param {string} path - File path
     */
    renameFile(path) {
        const file = this.findFileByPath(path);
        if (!file) return;
        
        const oldName = file.name;
        
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.show({
                title: 'Rename File',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">New Name</label>
                            <input type="text" id="new-file-name" class="w-full" value="${oldName}">
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    const newName = document.getElementById('new-file-name').value;
                    if (newName && newName !== oldName) {
                        file.name = newName;
                        
                        // Save project
                        localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
                        
                        // Refresh file tree
                        this.renderFileTree();
                        
                        // Show notification
                        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                            window.slimCodeEditor.notifications.show({
                                title: 'File Renamed',
                                message: `File "${oldName}" has been renamed to "${newName}".`,
                                type: 'success'
                            });
                        }
                    }
                }
            });
            
            // Focus the input
            setTimeout(() => {
                const input = document.getElementById('new-file-name');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        }
    }
    
    /**
     * Delete a file
     * @param {string} path - File path
     */
    deleteFile(path) {
        if (!this.currentProject) return;
        
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/');
        
        // Find parent folder
        let parentFolder;
        if (parentPath === this.currentProject.fileSystem.name) {
            parentFolder = this.currentProject.fileSystem;
        } else {
            const parentParts = parentPath.split('/');
            let current = this.currentProject.fileSystem;
            
            // Skip root folder name
            for (let i = 1; i < parentParts.length; i++) {
                if (current.type === 'folder' && current.children) {
                    const found = current.children.find(child => child.name === parentParts[i]);
                    if (found) {
                        current = found;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            }
            
            parentFolder = current;
        }
        
        if (parentFolder && parentFolder.children) {
            // Confirm deletion
            if (window.slimCodeEditor && window.slimCodeEditor.modal) {
                window.slimCodeEditor.modal.confirm({
                    title: 'Delete File',
                    message: `Are you sure you want to delete "${fileName}"?`,
                    onConfirm: () => {
                        // Remove file from parent folder
                        const index = parentFolder.children.findIndex(child => child.name === fileName);
                        if (index !== -1) {
                            parentFolder.children.splice(index, 1);
                            
                            // Save project
                            localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
                            
                            // Refresh file tree
                            this.renderFileTree();
                            
                            // Close tab if open
                            if (window.slimCodeEditor && window.slimCodeEditor.tabs) {
                                const tab = window.slimCodeEditor.tabs.findTabByPath(path);
                                if (tab) {
                                    window.slimCodeEditor.tabs.closeTab(tab);
                                }
                            }
                            
                            // Show notification
                            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                                window.slimCodeEditor.notifications.show({
                                    title: 'File Deleted',
                                    message: `File "${fileName}" has been deleted.`,
                                    type: 'success'
                                });
                            }
                        }
                    }
                });
            }
        }
    }
    
    /**
     * Refresh the file tree
     */
    refreshFileTree() {
        this.renderFileTree();
    }

    /**
     * Get all files in the current project
     * @returns {Promise<Object>} Object with file paths as keys and contents as values
     */
    async getCurrentProjectFiles() {
        if (!this.currentProject) {
            throw new Error('No project is currently open');
        }

        const files = {};
        const processNode = async (node, path = '') => {
            if (node.type === 'file') {
                const filePath = "/" + path + node.name;
                try {
                    const content = await this.readFile(filePath);
                    files[filePath] = content;
                } catch (error) {
                    console.error(`Failed to read file ${filePath}:`, error);
                }
            } else if (node.type === 'folder') {
                const folderPath = path + node.name + '/';
                for (const child of node.children) {
                    await processNode(child, folderPath);
                }
            }
        };

        for (const node of this.currentProject.fileSystem.children) {
            await processNode(node);
        }

        return files;
    }

    /**
     * Read a file's contents
     * @param {string} path - File path
     * @returns {Promise<string>} File contents
     */
    async readFile(path) {
        try {
            const file = this.findFileByPath(path);
            if (!file) {
                throw new Error('File not found');
            }
            return file.content || '';
        } catch (error) {
            throw new Error(`Failed to read file ${path}: ${error.message}`);
        }
    }
}