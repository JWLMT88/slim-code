class FileExplorer {
    constructor() {
        this.container = document.querySelector('.file-tree');
        this.currentProject = null;
        this.fileSystem = {};
        this.init();
    }
    init() {
        if (!this.container) {
            console.error('File explorer container not found');
            return;
        }
        this.initEventListeners();
        this.loadLastProject();
    }
    initEventListeners() {
        const newFileBtn = document.querySelector('.panel-header [title="New File"]');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => this.createNewFile());
        }
        const newFolderBtn = document.querySelector('.panel-header [title="New Folder"]');
        if (newFolderBtn) {
            newFolderBtn.addEventListener('click', () => this.createNewFolder());
        }
        const refreshBtn = document.querySelector('.panel-header [title="Refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshFileTree());
        }
        const searchInput = document.querySelector('.file-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchFiles(e.target.value));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.searchFiles('');
                }
            });
        }
        window.addEventListener('tabClosed', (e) => {
            if (e.detail && e.detail.path) {
                this.refreshFileTree();
            }
        });
    }
    loadLastProject() {
        const lastProject = localStorage.getItem('slim-code-editor-last-project');
        if (lastProject) {
            try {
                const projectData = JSON.parse(lastProject);
                this.openProject(projectData.name, projectData.fileSystem);
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
    createProject(nameOrStructure, type) {
        if (typeof nameOrStructure === 'object' && nameOrStructure !== null) {
            const projectStructure = nameOrStructure;
            if (!projectStructure.name || !projectStructure.type || projectStructure.type !== 'folder') {
                console.error('Invalid project structure:', projectStructure);
                return;
            }
            this.openProject(projectStructure.name, projectStructure);
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'Repository Cloned',
                    message: `Repository "${projectStructure.name}" has been cloned successfully.`,
                    type: 'success'
                });
            }
            return;
        }
        const name = nameOrStructure;
        if (!name) return;
        const fileSystem = this.createProjectTemplate(name, type);
        this.openProject(name, fileSystem);
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'Project Created',
                message: `Project "${name}" has been created.`,
                type: 'success'
            });
        }
    }
    createProjectTemplate(name, type) {
        const fileSystem = {
            type: 'folder',
            name,
            children: []
        };
        switch (type) {
            case 'web':
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
                                content: `
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
                                content: `
document.addEventListener('DOMContentLoaded', () => {
    console.log('${name} application loaded');
});`
                            }
                        ]
                    }
                ];
                break;
            case 'node':
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
                        content: `
console.log('${name} application started');
const http = require('http');
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, World!\\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(\`Server running at http:
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
    openProject(name, fileSystem) {
        this.currentProject = {
            name,
            fileSystem
        };
        this.renderFileTree();
        localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
        window.dispatchEvent(new CustomEvent('projectOpened', {
            detail: {
                name,
                fileSystem
            }
        }));
    }
    openFolder() {
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
    }
    renderFileTree() {
        if (!this.container || !this.currentProject) return;
        this.container.innerHTML = '';
        this.renderFolder(this.currentProject.fileSystem, this.container, '');
    }
    renderFolder(folder, container, path) {
        const folderItem = document.createElement('div');
        folderItem.className = 'file-tree-item';
        folderItem.dataset.path = path;
        folderItem.dataset.type = 'folder';
        const folderContent = document.createElement('div');
        folderContent.className = 'item-content';
        const arrow = document.createElement('span');
        arrow.className = 'directory-arrow material-icons';
        arrow.textContent = 'chevron_right';
        arrow.setAttribute('aria-hidden', 'true');
        const icon = document.createElement('span');
        icon.className = 'file-icon material-icons';
        icon.textContent = 'folder';
        icon.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span');
        name.className = 'file-name';
        name.textContent = folder.name;
        name.setAttribute('title', folder.name);
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const addFileBtn = document.createElement('button');
        addFileBtn.className = 'item-action';
        addFileBtn.title = 'New File';
        addFileBtn.innerHTML = '<span class="material-icons">add</span>';
        addFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.createNewFile(path);
        });
        const addFolderBtn = document.createElement('button');
        addFolderBtn.className = 'item-action';
        addFolderBtn.title = 'New Folder';
        addFolderBtn.innerHTML = '<span class="material-icons">create_new_folder</span>';
        addFolderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.createNewFolder(path);
        });
        const renameBtn = document.createElement('button');
        renameBtn.className = 'item-action';
        renameBtn.title = 'Rename';
        renameBtn.innerHTML = '<span class="material-icons">edit</span>';
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.renameFile(path);
        });
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'item-action';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFile(path);
        });
        actions.appendChild(addFileBtn);
        actions.appendChild(addFolderBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        folderContent.appendChild(arrow);
        folderContent.appendChild(icon);
        folderContent.appendChild(name);
        folderContent.appendChild(actions);
        folderItem.appendChild(folderContent);
        const children = document.createElement('div');
        children.className = 'children';
        children.style.display = 'none';
        folderItem.appendChild(children);
        container.appendChild(folderItem);
        folderContent.addEventListener('click', () => {
            const isExpanded = arrow.classList.contains('expanded');
            if (isExpanded) {
                arrow.classList.remove('expanded');
                icon.textContent = 'folder';
                children.style.display = 'none';
            } else {
                arrow.classList.add('expanded');
                icon.textContent = 'folder_open';
                children.style.display = 'block';
            }
        });
        if (folder.children && folder.children.length > 0) {
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    this.renderFolder(child, children, `${path}/${child.name}`);
                } else {
                    this.renderFile(child, children, `${path}/${child.name}`);
                }
            });
        }
    }
    renderFile(file, container, path) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-tree-item';
        fileItem.dataset.path = path;
        fileItem.dataset.type = 'file';
        const fileContent = document.createElement('div');
        fileContent.className = 'item-content';
        const icon = document.createElement('span');
        icon.className = 'file-icon material-icons';
        icon.setAttribute('aria-hidden', 'true');
        const extension = path.split('.').pop().toLowerCase();
        const iconName = this.getFileIcon(extension);
        icon.textContent = iconName;
        if (extension === 'html' || extension === 'htm') {
            icon.style.color = '#e44d26';
        } else if (extension === 'css') {
            icon.style.color = '#264de4';
        } else if (extension === 'js') {
            icon.style.color = '#f7df1e';
        } else if (extension === 'json') {
            icon.style.color = '#5b5b5b';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
            icon.style.color = '#8bc34a';
        }
        const name = document.createElement('span');
        name.className = 'file-name';
        name.textContent = file.name;
        name.setAttribute('title', file.name);
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'status-indicator';
        const actions = document.createElement('div');
        actions.className = 'item-actions';
        const renameBtn = document.createElement('button');
        renameBtn.className = 'item-action';
        renameBtn.title = 'Rename';
        renameBtn.innerHTML = '<span class="material-icons">edit</span>';
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.renameFile(path);
        });
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'item-action';
        deleteBtn.title = 'Delete';
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFile(path);
        });
        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        fileContent.appendChild(icon);
        fileContent.appendChild(name);
        fileContent.appendChild(statusIndicator);
        fileContent.appendChild(actions);
        fileItem.appendChild(fileContent);
        container.appendChild(fileItem);
        fileContent.addEventListener('click', () => {
            this.openFile(path);
        });
    }
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
    openFile(path) {
        const file = this.findFileByPath(path);
        if (file) {
            if (window.slimCodeEditor && window.slimCodeEditor.tabs) {
                window.slimCodeEditor.tabs.createTab({
                    path,
                    content: file.content
                });
            }
            this.highlightFile(path);
            window.dispatchEvent(new CustomEvent('fileOpened', {
                detail: {
                    path,
                    content: file.content,
                    language: this.getLanguageFromExtension(path.split('.').pop().toLowerCase())
                }
            }));
        }
    }
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
    highlightFile(path) {
        const fileItems = document.querySelectorAll('.file-tree-item');
        fileItems.forEach(item => item.classList.remove('active'));
        const fileItem = document.querySelector(`.file-tree-item[data-path="${path}"]`);
        if (fileItem) {
            fileItem.classList.add('active');
            let parent = fileItem.parentElement;
            while (parent && parent.classList.contains('children')) {
                parent.style.display = 'block';
                const folderItem = parent.previousElementSibling;
                if (folderItem && folderItem.classList.contains('file-tree-item')) {
                    const folderIcon = folderItem.querySelector('.file-icon');
                    if (folderIcon) {
                        folderIcon.textContent = 'folder_open';
                    }
                }
                parent = parent.parentElement.parentElement;
            }
        }
    }
    findFileByPath(path) {
        if (!this.currentProject) return null;
        const parts = path.split('/');
        let current = this.currentProject.fileSystem;
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
    saveFile(path, content) {
        if (!this.currentProject) return;
        const file = this.findFileByPath(path);
        if (file) {
            file.content = content;
            localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
            if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                window.slimCodeEditor.notifications.show({
                    title: 'File Saved',
                    message: `File "${path.split('/').pop()}" has been saved.`,
                    type: 'success'
                });
            }
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
    createNewFile(parentPath = null) {
        if (!this.currentProject) {
            this.showNoProjectError();
            return;
        }
        const currentPath = parentPath || '';
        window.slimCodeEditor.modal.show({
            title: 'Create New File',
            body: `
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label for="file-name" class="text-sm text-editor-text-muted">File Name</label>
                        <input type="text" id="file-name" class="w-full bg-editor-bg border border-editor-border rounded p-2 text-sm focus:outline-none focus:border-editor-accent" placeholder="e.g. index.html">
                    </div>
                    <div class="text-xs text-editor-text-muted">
                        <p>Creating file in: <span class="text-editor-accent">${currentPath || 'root'}</span></p>
                    </div>
                </div>
            `,
            onConfirm: () => {
                const fileName = document.getElementById('file-name').value;
                if (fileName) {
                    this.addFile(fileName, '', currentPath);
                }
            }
        });
    }
    createNewFolder(parentPath = null) {
        if (!this.currentProject) {
            this.showNoProjectError();
            return;
        }
        const currentPath = parentPath || '';
        window.slimCodeEditor.modal.show({
            title: 'Create New Folder',
            body: `
                <div class="space-y-4">
                    <div class="space-y-2">
                        <label for="folder-name" class="text-sm text-editor-text-muted">Folder Name</label>
                        <input type="text" id="folder-name" class="w-full bg-editor-bg border border-editor-border rounded p-2 text-sm focus:outline-none focus:border-editor-accent" placeholder="e.g. src">
                    </div>
                    <div class="text-xs text-editor-text-muted">
                        <p>Creating folder in: <span class="text-editor-accent">${currentPath || 'root'}</span></p>
                    </div>
                </div>
            `,
            onConfirm: () => {
                const folderName = document.getElementById('folder-name').value;
                if (folderName) {
                    this.addFolder(folderName, currentPath);
                }
            }
        });
    }
    addFile(name, content = '', parentPath = '') {
        if (!this.currentProject) return;
        const file = {
            type: 'file',
            name,
            content
        };
        if (!parentPath) {
            this.fileSystem.children.push(file);
        } else {
            const folder = this.findFileByPath(parentPath);
            if (folder && folder.type === 'folder') {
                if (!folder.children) {
                    folder.children = [];
                }
                folder.children.push(file);
            } else {
                console.error('Parent folder not found:', parentPath);
                return;
            }
        }
        this.refreshFileTree();
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'File Created',
                message: `File "${name}" has been created.`,
                type: 'success'
            });
        }
        const filePath = parentPath ? `${parentPath}/${name}` : name;
        this.openFile(filePath);
    }
    addFolder(name, parentPath = '') {
        if (!this.currentProject) return;
        const folder = {
            type: 'folder',
            name,
            children: []
        };
        if (!parentPath) {
            this.fileSystem.children.push(folder);
        } else {
            const parentFolder = this.findFileByPath(parentPath);
            if (parentFolder && parentFolder.type === 'folder') {
                if (!parentFolder.children) {
                    parentFolder.children = [];
                }
                parentFolder.children.push(folder);
            } else {
                console.error('Parent folder not found:', parentPath);
                return;
            }
        }
        this.refreshFileTree();
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'Folder Created',
                message: `Folder "${name}" has been created.`,
                type: 'success'
            });
        }
    }
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
                        localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
                        this.renderFileTree();
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
            setTimeout(() => {
                const input = document.getElementById('new-file-name');
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 100);
        }
    }
    deleteFile(path) {
        if (!this.currentProject) return;
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/');
        let parentFolder;
        if (parentPath === this.currentProject.fileSystem.name) {
            parentFolder = this.currentProject.fileSystem;
        } else {
            const parentParts = parentPath.split('/');
            let current = this.currentProject.fileSystem;
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
            if (window.slimCodeEditor && window.slimCodeEditor.modal) {
                window.slimCodeEditor.modal.confirm({
                    title: 'Delete File',
                    message: `Are you sure you want to delete "${fileName}"?`,
                    onConfirm: () => {
                        const index = parentFolder.children.findIndex(child => child.name === fileName);
                        if (index !== -1) {
                            parentFolder.children.splice(index, 1);
                            localStorage.setItem('slim-code-editor-last-project', JSON.stringify(this.currentProject));
                            this.renderFileTree();
                            if (window.slimCodeEditor && window.slimCodeEditor.tabs) {
                                const tab = window.slimCodeEditor.tabs.findTabByPath(path);
                                if (tab) {
                                    window.slimCodeEditor.tabs.closeTab(tab);
                                }
                            }
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
    refreshFileTree() {
        this.renderFileTree();
    }
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
    searchFiles(query) {
        const searchInput = document.querySelector('.file-search');
        let resultsCount = document.querySelector('.search-results-count');
        if (!resultsCount) {
            resultsCount = document.createElement('span');
            resultsCount.className = 'search-results-count absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-editor-text-muted';
            searchInput.parentNode.appendChild(resultsCount);
        }
        if (!query || query.trim() === '') {
            document.querySelectorAll('.file-tree-item').forEach(item => {
                item.style.display = 'block';
                item.classList.remove('search-match');
                if (item.dataset.type === 'folder') {
                    const arrow = item.querySelector('.directory-arrow');
                    const icon = item.querySelector('.file-icon');
                    const children = item.querySelector('.children');
                    arrow.classList.remove('expanded');
                    icon.textContent = 'folder';
                    children.style.display = 'none';
                }
            });
            resultsCount.style.display = 'none';
            return;
        }
        query = query.toLowerCase().trim();
        const fileItems = document.querySelectorAll('.file-tree-item');
        const foldersToExpand = new Set();
        let matchCount = 0;
        fileItems.forEach(item => {
            const path = item.dataset.path;
            const fileName = path.split('/').pop().toLowerCase();
            if (fileName.includes(query)) {
                item.style.display = 'block';
                item.classList.add('search-match');
                if (item.dataset.type === 'file') {
                    matchCount++;
                }
                let parentPath = path.substring(0, path.lastIndexOf('/'));
                while (parentPath) {
                    foldersToExpand.add(parentPath);
                    parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
                }
            } else {
                item.style.display = 'none';
                item.classList.remove('search-match');
            }
        });
        fileItems.forEach(item => {
            if (item.dataset.type === 'folder') {
                const path = item.dataset.path;
                if (foldersToExpand.has(path)) {
                    item.style.display = 'block';
                    const arrow = item.querySelector('.directory-arrow');
                    const icon = item.querySelector('.file-icon');
                    const children = item.querySelector('.children');
                    arrow.classList.add('expanded');
                    icon.textContent = 'folder_open';
                    children.style.display = 'block';
                }
            }
        });
        resultsCount.style.display = 'block';
        resultsCount.textContent = matchCount > 0 ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}` : 'No matches';
        if (matchCount > 0) {
            resultsCount.classList.remove('text-editor-error');
            resultsCount.classList.add('text-editor-accent');
        } else {
            resultsCount.classList.remove('text-editor-accent');
            resultsCount.classList.add('text-editor-error');
        }
    }
    showNoProjectError() {
        window.slimCodeEditor.notifications.show({
            title: 'No Project Open',
            message: 'Please open or create a project first.',
            type: 'warning'
        });
    }
}

