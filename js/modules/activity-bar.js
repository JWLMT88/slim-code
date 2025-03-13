class ActivityBar {
    constructor() {
        this.container = document.querySelector('.activity-bar');
        this.items = [];
        this.activeItem = null;
        this.init();
    }
    init() {
        if (!this.container) {
            console.error('Activity bar container not found');
            return;
        }
        const existingButtons = this.container.querySelectorAll('.activity-button');
        if (existingButtons.length > 0) {
            existingButtons.forEach(button => {
                const panelId = button.getAttribute('data-panel');
                const icon = button.querySelector('.material-icons');
                if (panelId && icon) {
                    this.items.push({
                        element: button,
                        id: panelId,
                        icon: icon.textContent
                    });
                    button.addEventListener('click', () => {
                        this.activateItem(button);
                    });
                    if (button.classList.contains('active')) {
                        this.activeItem = button;
                    }
                }
            });
            if (!this.activeItem && this.items.length > 0) {
                this.activateItem(this.items[0].element);
            }
        } else {
            this.addItem({
                id: 'explorer',
                icon: 'description',
                title: 'Explorer',
                panel: 'explorer',
                active: true
            });
            this.addItem({
                id: 'search',
                icon: 'search',
                title: 'Search',
                panel: 'search'
            });
            this.addItem({
                id: 'notes',
                icon: 'sticky_note_2',
                title: 'Notes',
                panel: 'notes'
            });
            this.addItem({
                id: 'settings',
                icon: 'settings',
                title: 'Settings',
                panel: 'settings',
                position: 'bottom'
            });
        }
    }
    addItem(options) {
        const { id, icon, title, panel, active = false, position = 'top' } = options;
        const item = document.createElement('button');
        item.className = 'activity-button';
        item.dataset.id = id;
        item.dataset.panel = panel;
        item.title = title;
        if (active) {
            item.classList.add('active');
            this.activeItem = item;
        }
        const iconElement = document.createElement('span');
        iconElement.className = 'material-icons';
        iconElement.textContent = icon;
        item.appendChild(iconElement);
        item.addEventListener('click', () => {
            this.activateItem(item);
        });
        if (position === 'bottom') {
            let bottomContainer = this.container.querySelector('.mt-auto');
            if (!bottomContainer) {
                bottomContainer = document.createElement('div');
                bottomContainer.className = 'mt-auto';
                this.container.appendChild(bottomContainer);
            }
            bottomContainer.appendChild(item);
        } else {
            if (this.container.firstChild) {
                this.container.insertBefore(item, this.container.firstChild);
            } else {
                this.container.appendChild(item);
            }
        }
        this.items.push({
            element: item,
            id,
            icon
        });
        return item;
    }
    activateItem(item) {
        if (this.activeItem) {
            this.activeItem.classList.remove('active');
        }
        item.classList.add('active');
        this.activeItem = item;
        this.showPanel(item.dataset.panel);
        window.dispatchEvent(new CustomEvent('activityBarItemActivated', {
            detail: {
                id: item.dataset.id,
                panel: item.dataset.panel
            }
        }));
    }
    showPanel(panelId) {
        const panels = document.querySelectorAll('.sidebar-panel');
        panels.forEach(panel => {
            panel.classList.add('hidden');
            panel.classList.remove('active');
        });
        const panel = document.querySelector(`.sidebar-panel[data-panel="${panelId}"]`);
        if (panel) {
            panel.classList.remove('hidden');
            panel.classList.add('active');
        }
    }
    getActiveItem() {
        return this.activeItem;
    }
    getItemById(id) {
        const item = this.items.find(item => item.element.dataset.id === id);
        return item ? item.element : null;
    }
    activateItemById(id) {
        const item = this.getItemById(id);
        if (item) {
            this.activateItem(item);
        }
    }
} 

