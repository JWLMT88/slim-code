class Sidebar {
    constructor() {
        this.activeTab = 'explorer';
        this.tabs = ['explorer', 'extensions', 'projects'];
        this.sidebar = document.querySelector('.sidebar');
        this.resizeHandle = document.querySelector('.resize-handle');
        this.collapseButton = document.querySelector('.collapse-button');
        this.isResizing = false;
        this.minWidth = 200;
        this.maxWidth = 600;
        this.lastWidth = 256; // Default width when expanded
        
        this.init();
        this.explorer = window.explorer;
        this.projects = window.projects;
    }

    init() {
        this.initTabListeners();
        this.initResizeListeners();
        this.initCollapseListeners();
        this.showTab(this.activeTab);
        this.loadSidebarState();
    }

    initResizeListeners() {
        this.resizeHandle.addEventListener('mousedown', (e) => {
            this.isResizing = true;
            this.resizeHandle.classList.add('active');
            document.addEventListener('mousemove', this.handleResize);
            document.addEventListener('mouseup', this.stopResize);
            e.preventDefault();
        });

        this.handleResize = this.handleResize.bind(this);
        this.stopResize = this.stopResize.bind(this);
    }

    handleResize(e) {
        if (!this.isResizing) return;
        
        let newWidth = e.clientX;
        
        newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));
        
        this.sidebar.style.width = `${newWidth}px`;
        this.lastWidth = newWidth;
        
        this.saveSidebarState();
        
        if (window.editor && window.editor.editor) {
            window.editor.editor.layout();
        }
    }

    stopResize() {
        this.isResizing = false;
        this.resizeHandle.classList.remove('active');
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);
    }

    initCollapseListeners() {
        this.collapseButton.addEventListener('click', () => this.toggleCollapse());
        
        this.resizeHandle.addEventListener('dblclick', () => this.toggleCollapse());
    }

    toggleCollapse() {
        const isCollapsed = this.sidebar.classList.toggle('collapsed');
        
        if (!isCollapsed) {
            this.sidebar.style.width = `${this.lastWidth}px`;
        }
        
        this.saveSidebarState();
        
        if (window.editor && window.editor.editor) {
            window.editor.editor.layout();
        }
    }

    loadSidebarState() {
        const state = getFromLocalStorage('sidebarState', {
            width: 256,
            collapsed: false
        });
        
        if (state.collapsed) {
            this.sidebar.classList.add('collapsed');
        } else {
            this.sidebar.style.width = `${state.width}px`;
        }
        
        this.lastWidth = state.width;
    }

    saveSidebarState() {
        const state = {
            width: this.lastWidth,
            collapsed: this.sidebar.classList.contains('collapsed')
        };
        
        saveToLocalStorage('sidebarState', state);
    }

    initTabListeners() {
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => this.showTab(tab.dataset.tab));
        });
    }

    showTab(tabName) {
        document.querySelectorAll('[data-content]').forEach(content => {
            content.classList.add('hidden');
            content.classList.remove('active');
        });

        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.remove('border-editor-accent');
            tab.classList.remove('active');
        });

        const content = document.querySelector(`[data-content="${tabName}"]`);
        content.classList.remove('hidden');
        setTimeout(() => content.classList.add('active'), 10);

        const tab = document.querySelector(`[data-tab="${tabName}"]`);
        tab.classList.add('border-editor-accent');
        tab.classList.add('active');

        this.activeTab = tabName;
        this.onTabChange(tabName);
    }

    onTabChange(tabName) {
        switch(tabName) {
            case 'explorer':
                if (!this.explorer) {
                    this.explorer = new Explorer();
                }
                break;
            case 'extensions':
                if (!this.extensions) {
                    this.extensions = new Extensions();
                }
                break;
            case 'projects':
                if (!this.projects) {
                    this.projects = new Projects();
                }
                break;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new Sidebar();
});