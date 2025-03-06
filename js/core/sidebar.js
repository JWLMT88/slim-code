/**
 * Sidebar Class
 * Manages the sidebar functionality and resizing
 */
class Sidebar {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.resizer = document.querySelector('.sidebar-resizer');
        this.minWidth = 200;
        this.maxWidth = 600;
        
        this.init();
    }
    
    /**
     * Initialize the sidebar
     */
    init() {
        if (!this.sidebar || !this.resizer) return;
        
        // Initialize sidebar resizing
        this.initResizer();
        
        // Load saved width
        this.loadSavedWidth();
    }
    
    /**
     * Initialize sidebar resizer
     */
    initResizer() {
        let startX, startWidth;
        
        const startResize = (e) => {
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(this.sidebar).width, 10);
            document.documentElement.classList.add('resize-cursor');
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };
        
        const resize = (e) => {
            const newWidth = startWidth + e.clientX - startX;
            
            // Apply min/max constraints
            if (newWidth >= this.minWidth && newWidth <= this.maxWidth) {
                this.sidebar.style.width = `${newWidth}px`;
            }
        };
        
        const stopResize = () => {
            document.documentElement.classList.remove('resize-cursor');
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            
            // Save the new width
            this.saveWidth();
        };
        
        this.resizer.addEventListener('mousedown', startResize);
    }
    
    /**
     * Save sidebar width to localStorage
     */
    saveWidth() {
        const width = this.sidebar.style.width;
        if (width) {
            localStorage.setItem('slim-code-editor-sidebar-width', width);
        }
    }
    
    /**
     * Load saved sidebar width from localStorage
     */
    loadSavedWidth() {
        const savedWidth = localStorage.getItem('slim-code-editor-sidebar-width');
        if (savedWidth) {
            this.sidebar.style.width = savedWidth;
        }
    }
    
    /**
     * Toggle sidebar visibility
     */
    toggle() {
        if (!this.sidebar) return;
        
        const isVisible = !this.sidebar.classList.contains('hidden');
        
        if (isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Show sidebar
     */
    show() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.remove('hidden');
    }
    
    /**
     * Hide sidebar
     */
    hide() {
        if (!this.sidebar) return;
        
        this.sidebar.classList.add('hidden');
    }
} 