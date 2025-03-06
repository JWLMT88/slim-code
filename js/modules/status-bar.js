/**
 * StatusBar Class
 * Manages the status bar at the bottom of the editor
 */
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
    
    /**
     * Initialize status bar
     */
    init() {
        if (!this.container) return;
        
        // Create default sections if they don't exist
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
        
        // Add default status items
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
        
        // Listen for editor events
        this.listenForEditorEvents();
    }
    
    /**
     * Add a status bar item
     * @param {string} id - Item ID
     * @param {Object} options - Item options
     * @param {string} options.text - Item text
     * @param {string} options.section - Section ('left' or 'right')
     * @param {number} options.priority - Priority (higher number = higher priority)
     * @param {Function} options.onClick - Click handler
     * @returns {HTMLElement} Item element
     */
    addItem(id, options) {
        const { text, section = 'left', priority = 0, onClick } = options;
        
        // Create item element
        const item = document.createElement('div');
        item.className = 'status-bar-item';
        item.textContent = text;
        item.dataset.id = id;
        
        if (onClick) {
            item.addEventListener('click', onClick);
            item.classList.add('clickable');
        }
        
        // Store item in items object
        this.items[section][id] = {
            element: item,
            priority,
            text
        };
        
        // Render items in the correct order
        this.renderItems(section);
        
        return item;
    }
    
    /**
     * Update a status bar item
     * @param {string} id - Item ID
     * @param {string} text - New text
     * @param {string} section - Section ('left' or 'right')
     */
    updateItem(id, text, section = 'left') {
        if (!this.items[section][id]) return;
        
        this.items[section][id].text = text;
        this.items[section][id].element.textContent = text;
    }
    
    /**
     * Remove a status bar item
     * @param {string} id - Item ID
     * @param {string} section - Section ('left' or 'right')
     */
    removeItem(id, section = 'left') {
        if (!this.items[section][id]) return;
        
        const item = this.items[section][id];
        item.element.remove();
        delete this.items[section][id];
    }
    
    /**
     * Render items in a section
     * @param {string} section - Section ('left' or 'right')
     */
    renderItems(section) {
        const sectionElement = section === 'left' ? this.leftSection : this.rightSection;
        
        // Clear section
        sectionElement.innerHTML = '';
        
        // Sort items by priority
        const sortedItems = Object.values(this.items[section]).sort((a, b) => b.priority - a.priority);
        
        // Append items to section
        sortedItems.forEach(item => {
            sectionElement.appendChild(item.element);
        });
    }
    
    /**
     * Listen for editor events
     */
    listenForEditorEvents() {
        // Listen for cursor position changes
        window.addEventListener('editorCursorChange', (e) => {
            const { lineNumber, column } = e.detail;
            this.updateItem('position', `Ln ${lineNumber}, Col ${column}`, 'right');
        });
        
        // Listen for active file changes
        window.addEventListener('fileOpened', (e) => {
            const { path, language } = e.detail;
            
            // Update file type
            const fileType = language || this.getFileType(path) || 'Plain Text';
            this.updateItem('fileType', fileType, 'right');
            
            // Update indentation based on settings
            if (window.slimCodeEditor && window.slimCodeEditor.settings) {
                const settings = window.slimCodeEditor.settings.settings;
                const insertSpaces = settings.editor.insertSpaces;
                const tabSize = settings.editor.tabSize;
                
                this.updateItem('indentation', insertSpaces ? `Spaces: ${tabSize}` : 'Tabs', 'right');
            }
        });
        
        // Listen for settings changes
        window.addEventListener('settingsChanged', (e) => {
            const settings = e.detail;
            
            // Update indentation
            const insertSpaces = settings.editor.insertSpaces;
            const tabSize = settings.editor.tabSize;
            
            this.updateItem('indentation', insertSpaces ? `Spaces: ${tabSize}` : 'Tabs', 'right');
        });
    }
    
    /**
     * Get file type from file path
     * @param {string} path - File path
     * @returns {string} File type
     */
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