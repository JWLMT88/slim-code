class StatusBar {
    constructor() {
        this.container = document.querySelector('.status-bar');
        this.leftSection = document.querySelector('.status-bar-left');
        this.rightSection = document.querySelector('.status-bar-right');
        this.items = {
            left: {},
            right: {}
        };
        this.init();
    }
    init() {
        if (!this.container) return;
        if (!this.leftSection) {
            this.leftSection = document.createElement('div');
            this.leftSection.className = 'status-bar-left';
            this.container.appendChild(this.leftSection);
        }
        if (!this.rightSection) {
            this.rightSection = document.createElement('div');
            this.rightSection.className = 'status-bar-right flex gap-3';
            this.container.appendChild(this.rightSection);
        }
        this.addItem('position', {
            text: 'Ln 1, Col 1',
            section: 'right',
            priority: 100
        });
        this.addItem('encoding', {
            text: 'UTF-8',
            section: 'right',
            priority: 90
        });
        this.addItem('eol', {
            text: 'LF',
            section: 'right',
            priority: 80
        });
        this.addItem('indentation', {
            text: 'Spaces: 4',
            section: 'right',
            priority: 70
        });
        this.addItem('fileType', {
            text: 'Plain Text',
            section: 'right',
            priority: 60
        });
        this.addItem('editorMode', {
            text: 'Normal',
            section: 'left',
            priority: 100
        });
        this.listenForEditorEvents();
    }
    addItem(id, options) {
        const { text, section = 'left', priority = 0, onClick } = options;
        const item = document.createElement('div');
        item.className = 'status-bar-item';
        item.textContent = text;
        item.dataset.id = id;
        if (onClick) {
            item.addEventListener('click', onClick);
            item.classList.add('clickable');
        }
        this.items[section][id] = {
            element: item,
            priority,
            text
        };
        this.renderItems(section);
        return item;
    }
    updateItem(id, text, section = 'left') {
        if (!this.items[section][id]) return;
        this.items[section][id].text = text;
        this.items[section][id].element.textContent = text;
    }
    removeItem(id, section = 'left') {
        if (!this.items[section][id]) return;
        const item = this.items[section][id];
        item.element.remove();
        delete this.items[section][id];
    }
    renderItems(section) {
        const sectionElement = section === 'left' ? this.leftSection : this.rightSection;
        sectionElement.innerHTML = '';
        const sortedItems = Object.values(this.items[section]).sort((a, b) => b.priority - a.priority);
        sortedItems.forEach(item => {
            sectionElement.appendChild(item.element);
        });
    }
    listenForEditorEvents() {
        window.addEventListener('editorCursorChange', (e) => {
            const { lineNumber, column } = e.detail;
            this.updateItem('position', `Ln ${lineNumber}, Col ${column}`, 'right');
        });
        window.addEventListener('fileOpened', (e) => {
            const { path, language } = e.detail;
            const fileType = language || this.getFileType(path) || 'Plain Text';
            this.updateItem('fileType', fileType, 'right');
            if (window.slimCodeEditor && window.slimCodeEditor.settings) {
                const settings = window.slimCodeEditor.settings.settings;
                const insertSpaces = settings.editor.insertSpaces;
                const tabSize = settings.editor.tabSize;
                this.updateItem('indentation', insertSpaces ? `Spaces: ${tabSize}` : 'Tabs', 'right');
            }
        });
        window.addEventListener('settingsChanged', (e) => {
            const settings = e.detail;
            const insertSpaces = settings.editor.insertSpaces;
            const tabSize = settings.editor.tabSize;
            this.updateItem('indentation', insertSpaces ? `Spaces: ${tabSize}` : 'Tabs', 'right');
        });
    }
    getFileType(path) {
        if (!path) return 'Plain Text';
        const extension = path.split('.').pop().toLowerCase();
        const fileTypes = {
            'js': 'JavaScript',
            'jsx': 'React JSX',
            'ts': 'TypeScript',
            'tsx': 'React TSX',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass',
            'less': 'Less',
            'json': 'JSON',
            'md': 'Markdown',
            'txt': 'Plain Text',
            'py': 'Python',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'cs': 'C#',
            'go': 'Go',
            'php': 'PHP',
            'rb': 'Ruby',
            'rs': 'Rust',
            'swift': 'Swift',
            'sh': 'Shell',
            'bat': 'Batch',
            'ps1': 'PowerShell',
            'sql': 'SQL',
            'xml': 'XML',
            'yaml': 'YAML',
            'yml': 'YAML'
        };
        return fileTypes[extension] || 'Plain Text';
    }
} 

