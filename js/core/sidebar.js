class Sidebar {
    constructor() {
        this.sidebar = document.querySelector('.sidebar');
        this.resizer = document.querySelector('.sidebar-resizer');
        this.collapseButton = document.querySelector('.collapse-button');
        this.minWidth = 200;
        this.maxWidth = 600;
        this.defaultWidth = 260;
        this.isResizing = false;
        this.init();
    }
    init() {
        if (!this.sidebar || !this.resizer) return;
        this.initResizer();
        this.initCollapseButton();
        this.loadSavedWidth();
        window.addEventListener('resize', this.handleWindowResize.bind(this));
    }
    initResizer() {
        let startX, startWidth;
        const startResize = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault();
            }
            startX = e.clientX || e.touches[0].clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(this.sidebar).width, 10);
            this.resizer.classList.add('active');
            document.documentElement.classList.add('resize-cursor');
            this.isResizing = true;
            if (e.type === 'mousedown') {
                document.addEventListener('mousemove', this.resize);
                document.addEventListener('mouseup', this.stopResize);
            } else if (e.type === 'touchstart') {
                document.addEventListener('touchmove', this.resize);
                document.addEventListener('touchend', this.stopResize);
            }
        };
        this.resize = (e) => {
            if (!this.isResizing) return;
            const clientX = e.clientX || e.touches[0].clientX;
            const newWidth = startWidth + clientX - startX;
            if (newWidth >= this.minWidth && newWidth <= this.maxWidth) {
                this.sidebar.style.width = `${newWidth}px`;
                window.dispatchEvent(new Event('resize'));
            }
        };
        this.stopResize = () => {
            this.resizer.classList.remove('active');
            document.documentElement.classList.remove('resize-cursor');
            this.isResizing = false;
            document.removeEventListener('mousemove', this.resize);
            document.removeEventListener('mouseup', this.stopResize);
            document.removeEventListener('touchmove', this.resize);
            document.removeEventListener('touchend', this.stopResize);
            this.saveWidth();
        };
        this.resize = this.resize.bind(this);
        this.stopResize = this.stopResize.bind(this);
        this.resizer.addEventListener('mousedown', startResize);
        this.resizer.addEventListener('touchstart', startResize, { passive: false });
    }
    initCollapseButton() {
        if (!this.collapseButton) return;
        this.collapseButton.addEventListener('click', () => {
            this.toggleCollapse();
        });
    }
    toggleCollapse() {
        if (this.sidebar.classList.contains('collapsed')) {
            this.sidebar.classList.remove('collapsed');
            this.loadSavedWidth();
        } else {
            this.saveWidth();
            this.sidebar.classList.add('collapsed');
        }
        window.dispatchEvent(new Event('resize'));
    }
    handleWindowResize() {
        const currentWidth = parseInt(this.sidebar.style.width, 10);
        if (currentWidth > this.maxWidth) {
            this.sidebar.style.width = `${this.maxWidth}px`;
        }
    }
    saveWidth() {
        const width = this.sidebar.style.width;
        if (width) {
            localStorage.setItem('slim-code-editor-sidebar-width', width);
        }
    }
    loadSavedWidth() {
        const savedWidth = localStorage.getItem('slim-code-editor-sidebar-width');
        if (savedWidth) {
            this.sidebar.style.width = savedWidth;
        } else {
            this.sidebar.style.width = `${this.defaultWidth}px`;
        }
    }
    toggle() {
        if (!this.sidebar) return;
        const isVisible = !this.sidebar.classList.contains('hidden');
        if (isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    show() {
        if (!this.sidebar) return;
        this.sidebar.classList.remove('hidden');
        window.dispatchEvent(new Event('resize'));
    }
    hide() {
        if (!this.sidebar) return;
        this.sidebar.classList.add('hidden');
        window.dispatchEvent(new Event('resize'));
    }
}

