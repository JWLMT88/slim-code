class Explorer {
    constructor() {
        this.fileTree = document.getElementById('file-tree');
        this.openedFiles = new Set();
        this.currentFile = null;
        this.fileSystem = this.loadFileSystem();
        window.explorer = this;
        this.init();
    }

    init() {
        this.renderFileTree(this.fileSystem, this.fileTree);
        this.initEventListeners();
    }

    loadFileSystem() {
        return getFromLocalStorage('fileSystem', {
            'src': {
                type: 'directory',
                children: {
                    'index.html': { 
                        type: 'file', 
                        icon: 'html', 
                        content: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My App</title>\n  </head>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>' 
                    },
                    'styles': {
                        type: 'directory',
                        children: {
                            'main.css': { 
                                type: 'file', 
                                icon: 'css', 
                                content: 'body {\n  margin: 0;\n  padding: 20px;\n}' 
                            }
                        }
                    },
                    'scripts': {
                        type: 'directory',
                        children: {
                            'app.js': { 
                                type: 'file', 
                                icon: 'javascript', 
                                content: 'console.log("Hello World!");' 
                            }
                        }
                    }
                }
            },
            'docs': {
                type: 'directory',
                children: {
                    'README.md': { 
                        type: 'file', 
                        icon: 'description', 
                        content: '# My Project\n\nWelcome to my project!' 
                    }
                }
            }
        });
    }

    initEventListeners() {
        // New File button
        document.querySelector('[title="New File"]').addEventListener('click', () => this.createNewFile());
        
        // New Folder button
        document.querySelector('[title="New Folder"]').addEventListener('click', () => this.createNewFolder());
        
        // Refresh button
        document.querySelector('[title="Refresh"]').addEventListener('click', () => this.refresh());
        
        // Context menu
        this.fileTree.addEventListener('contextmenu', (e) => this.showContextMenu(e));
    }

    renderFileTree(structure, parentElement, path = '') {
        for (const [name, item] of Object.entries(structure)) {
            const itemElement = createElement('div', 'file-tree-item');
            const currentPath = path ? `${path}/${name}` : name;
            
            if (item.type === 'directory') {
                itemElement.innerHTML = `
                    <div class="item-content">
                        <div class="status-indicator"></div>
                        <span class="material-icons text-sm text-gray-400 directory-arrow">chevron_right</span>
                        <span class="material-icons text-sm text-gray-400">folder</span>
                        <span class="text-sm">${name}</span>
                    </div>
                    <div class="children hidden"></div>
                    <div class="drag-indicator drag-indicator-top"></div>
                    <div class="drag-indicator drag-indicator-bottom"></div>
                `;
                
                const arrow = itemElement.querySelector('.directory-arrow');
                const content = itemElement.querySelector('.item-content');
                const childContainer = itemElement.querySelector('.children');
                
                content.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('directory-arrow')) {
                        arrow.classList.toggle('expanded');
                        childContainer.classList.toggle('hidden');
                    }
                });
                
                arrow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    arrow.classList.toggle('expanded');
                    childContainer.classList.toggle('hidden');
                });
                
                this.setupDragAndDrop(itemElement, currentPath, true);
                this.setupContextMenu(itemElement, currentPath, true);
                
                parentElement.appendChild(itemElement);
                this.renderFileTree(item.children, childContainer, currentPath);
            } else {
                itemElement.innerHTML = `
                    <div class="item-content">
                        <div class="status-indicator"></div>
                        <span class="material-icons text-sm text-gray-400">${item.icon}</span>
                        <span class="text-sm">${name}</span>
                    </div>
                    <div class="drag-indicator drag-indicator-top"></div>
                    <div class="drag-indicator drag-indicator-bottom"></div>
                `;
                
                const content = itemElement.querySelector('.item-content');
                content.addEventListener('click', () => this.openFile(currentPath, item));
                
                this.setupDragAndDrop(itemElement, currentPath, false);
                this.setupContextMenu(itemElement, currentPath, false);
                
                if (this.openedFiles.has(currentPath)) {
                    itemElement.classList.add('active');
                }
                
                parentElement.appendChild(itemElement);
            }
        }
    }

    setupContextMenu(element, path, isDirectory) {
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, path, isDirectory);
        });
    }

    showContextMenu(e, path, isDirectory) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = createElement('div', 'context-menu');
        const menuItems = this.getContextMenuItems(path, isDirectory);

        menuItems.forEach(item => {
            if (item.separator) {
                menu.appendChild(createElement('div', 'context-menu-separator'));
            } else {
                const menuItem = createElement('div', `context-menu-item ${item.class || ''}`);
                menuItem.innerHTML = `
                    <span class="material-icons">${item.icon}</span>
                    <span>${item.label}</span>
                `;
                menuItem.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                menu.appendChild(menuItem);
            }
        });

        // Position menu
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;

        // Ensure menu stays within viewport
        document.body.appendChild(menu);
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${e.pageX - menuRect.width}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${e.pageY - menuRect.height}px`;
        }

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    getContextMenuItems(path, isDirectory) {
        const items = [];
        
        if (isDirectory) {
            items.push(
                {
                    label: 'New File',
                    icon: 'note_add',
                    action: () => this.createNewFileIn(path)
                },
                {
                    label: 'New Folder',
                    icon: 'create_new_folder',
                    action: () => this.createNewFolderIn(path)
                },
                { separator: true },
                {
                    label: 'Rename',
                    icon: 'drive_file_rename_outline',
                    action: () => this.renameItem(path)
                }
            );
        } else {
            items.push(
                {
                    label: 'Open',
                    icon: 'launch',
                    action: () => {
                        const file = this.getFileFromPath(path);
                        if (file) this.openFile(path, file);
                    }
                },
                { separator: true },
                {
                    label: 'Rename',
                    icon: 'drive_file_rename_outline',
                    action: () => this.renameItem(path)
                },
                {
                    label: 'Duplicate',
                    icon: 'file_copy',
                    action: () => this.duplicateFile(path)
                }
            );
        }

        items.push(
            { separator: true },
            {
                label: 'Delete',
                icon: 'delete',
                class: 'destructive',
                action: () => this.deleteItem(path)
            }
        );

        return items;
    }

    createNewFileIn(path) {
        const name = prompt('Enter file name:');
        if (!name) return;
        
        const newPath = path ? `${path}/${name}` : name;
        const file = {
            type: 'file',
            icon: getFileIcon(name),
            content: ''
        };
        
        this.addToFileSystem(newPath, file);
        this.refresh();
        this.openFile(newPath, file);
    }

    createNewFolderIn(path) {
        const name = prompt('Enter folder name:');
        if (!name) return;
        
        const newPath = path ? `${path}/${name}` : name;
        const folder = {
            type: 'directory',
            children: {}
        };
        
        this.addToFileSystem(newPath, folder);
        this.refresh();
    }

    renameItem(path) {
        const oldName = path.split('/').pop();
        const newName = prompt('Enter new name:', oldName);
        if (!newName || newName === oldName) return;

        const parentPath = path.substring(0, path.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        const item = this.getFileFromPath(path);
        if (!item) return;

        this.deleteFile(path);
        this.addToFileSystem(newPath, item);
        
        if (item.type === 'file' && this.openedFiles.has(path)) {
            this.openedFiles.delete(path);
            this.openedFiles.add(newPath);
            window.tabs.closeTab(path);
            this.openFile(newPath, item);
        }
        
        this.refresh();
    }

    duplicateFile(path) {
        const name = path.split('/').pop();
        const ext = name.includes('.') ? name.split('.').pop() : '';
        const baseName = ext ? name.slice(0, -(ext.length + 1)) : name;
        const newName = `${baseName} copy${ext ? `.${ext}` : ''}`;
        
        const parentPath = path.substring(0, path.lastIndexOf('/'));
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        const file = this.getFileFromPath(path);
        if (!file) return;
        
        const newFile = { ...file };
        this.addToFileSystem(newPath, newFile);
        this.refresh();
        this.openFile(newPath, newFile);
    }

    deleteItem(path) {
        if (confirm(`Are you sure you want to delete "${path}"?`)) {
            this.deleteFile(path);
            this.refresh();
        }
    }

    setupDragAndDrop(element, path, isDirectory) {
        element.draggable = true;
        
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', path);
            e.dataTransfer.effectAllowed = 'move';
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });

        if (isDirectory) {
            element.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                element.classList.add('drag-over');
            });

            element.addEventListener('dragleave', () => {
                element.classList.remove('drag-over');
            });

            element.addEventListener('drop', (e) => {
                e.preventDefault();
                element.classList.remove('drag-over');
                
                const sourcePath = e.dataTransfer.getData('text/plain');
                if (sourcePath !== path) {
                    this.moveItem(sourcePath, path);
                }
            });
        }
    }

    moveItem(sourcePath, targetPath) {
        const sourceItem = this.getFileFromPath(sourcePath);
        if (!sourceItem) return;

        const fileName = sourcePath.split('/').pop();
        const newPath = `${targetPath}/${fileName}`;

        this.deleteFile(sourcePath);
        this.addToFileSystem(newPath, sourceItem);
        
        if (sourceItem.type === 'file' && this.openedFiles.has(sourcePath)) {
            this.openedFiles.delete(sourcePath);
            this.openedFiles.add(newPath);
            window.tabs.closeTab(sourcePath);
            this.openFile(newPath, sourceItem);
        }
        
        this.refresh();
    }

    openFile(path, file) {
        let content = file.content;
        if (window.tabs) {
            const pendingFile = window.tabs.pendingFiles.get(path);
            if (pendingFile) {
                content = pendingFile.content;
            }
        }

        file.content = content;

        // Create or focus tab
        window.tabs.openTab(path, {
            ...file,
            content: content
        });
        
        // Set file content in editor
        window.editor.setValue(content);
        window.editor.updateOptions({
            language: getFileLanguage(path)
        });
        
        this.currentFile = { path, file };
        this.openedFiles.add(path);
        
        // Update status bar
        document.getElementById('file-type').textContent = getFileLanguage(path);
    }

    createNewFile() {
        const name = prompt('Enter file name:');
        if (!name) return;
        
        const path = this.currentFile ? getParentPath(this.currentFile.path) : '';
        const newPath = normalizePath(`${path}/${name}`);
        
        // Create file in file system
        const file = {
            type: 'file',
            icon: getFileIcon(name),
            content: ''
        };
        
        this.addToFileSystem(newPath, file);
        this.refresh();
        this.openFile(newPath, file);
    }

    createNewFolder() {
        const name = prompt('Enter folder name:');
        if (!name) return;
        
        const path = this.currentFile ? getParentPath(this.currentFile.path) : '';
        const newPath = normalizePath(`${path}/${name}`);
        
        // Create folder in file system
        const folder = {
            type: 'directory',
            children: {}
        };
        
        this.addToFileSystem(newPath, folder);
        this.refresh();
    }

    addToFileSystem(path, item) {
        const parts = path.split('/').filter(Boolean);
        let current = this.fileSystem;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = { type: 'directory', children: {} };
            }
            current = current[parts[i]].children;
        }
        
        const fileName = parts[parts.length - 1];
        
        // Check if there's pending content for this file
        if (window.tabs && item.type === 'file') {
            const pendingFile = window.tabs.pendingFiles.get(path);
            if (pendingFile) {
                item.content = pendingFile.content;
            }
        }
        
        current[fileName] = item;
        
        // Save to localStorage
        saveToLocalStorage('fileSystem', this.fileSystem);
    }

    refresh() {
        this.fileTree.innerHTML = '';
        this.renderFileTree(this.fileSystem, this.fileTree);
    }

    getFileFromPath(path) {
        // Navigate through file system to find file
        const parts = path.split('/').filter(Boolean);
        let current = this.fileSystem;

        for (const part of parts.slice(0, -1)) {
            if (!current[part] || current[part].type !== 'directory') return null;
            current = current[part].children;
        }

        const fileName = parts[parts.length - 1];
        return current[fileName];
    }

    deleteFile(path) {
        const parts = path.split('/').filter(Boolean);
        let current = this.fileSystem;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) return;
            current = current[parts[i]].children;
        }
        
        const fileName = parts[parts.length - 1];
        delete current[fileName];
        
        saveToLocalStorage('fileSystem', this.fileSystem);
        this.refresh();
        
        if (this.openedFiles.has(path)) {
            window.tabs.closeTab(path);
        }
    }
} 

document.addEventListener('DOMContentLoaded', () => {
    new Explorer();
});