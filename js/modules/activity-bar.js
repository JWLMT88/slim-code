/**
 * ActivityBar Class
 * Manages the activity bar on the side of the editor
 */
class ActivityBar {
    constructor() {
        this.container = document.querySelector('.activity-bar');
        this.items = [];
        this.activeItem = null;
        
        this.init();
    }
    
    /**
     * Initialize activity bar
     */
    init() {
        if (!this.container) {
            console.error('Activity bar container not found');
            return;
        }
        
        // Get existing activity buttons
        const existingButtons = this.container.querySelectorAll('.activity-button');
        
        // If buttons already exist, set up event listeners
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
                    
                    // Add click event listener
                    button.addEventListener('click', () => {
                        this.activateItem(button);
                    });
                    
                    // Set active item
                    if (button.classList.contains('active')) {
                        this.activeItem = button;
                    }
                }
            });
            
            // If no active item, activate the first one
            if (!this.activeItem && this.items.length > 0) {
                this.activateItem(this.items[0].element);
            }
        } else {
            // Add default activity bar items
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
            
            // Add bottom items
            this.addItem({
                id: 'settings',
                icon: 'settings',
                title: 'Settings',
                panel: 'settings',
                position: 'bottom'
            });
        }
    }
    
    /**
     * Add an activity bar item
     * @param {Object} options - Item options
     * @param {string} options.id - Item ID
     * @param {string} options.icon - Material icon name
     * @param {string} options.title - Item title
     * @param {string} options.panel - Panel ID to show when clicked
     * @param {boolean} options.active - Whether the item is active
     * @param {string} options.position - Item position ('top' or 'bottom')
     * @returns {HTMLElement} Item element
     */
    addItem(options) {
        const { id, icon, title, panel, active = false, position = 'top' } = options;
        
        // Create item element
        const item = document.createElement('button');
        item.className = 'activity-button';
        item.dataset.id = id;
        item.dataset.panel = panel;
        item.title = title;
        
        if (active) {
            item.classList.add('active');
            this.activeItem = item;
        }
        
        // Create icon
        const iconElement = document.createElement('span');
        iconElement.className = 'material-icons';
        iconElement.textContent = icon;
        
        item.appendChild(iconElement);
        
        // Add click event listener
        item.addEventListener('click', () => {
            this.activateItem(item);
        });
        
        // Add to container
        if (position === 'bottom') {
            // Create bottom container if it doesn't exist
            let bottomContainer = this.container.querySelector('.mt-auto');
            if (!bottomContainer) {
                bottomContainer = document.createElement('div');
                bottomContainer.className = 'mt-auto';
                this.container.appendChild(bottomContainer);
            }
            
            bottomContainer.appendChild(item);
        } else {
            // Add to top of container
            if (this.container.firstChild) {
                this.container.insertBefore(item, this.container.firstChild);
            } else {
                this.container.appendChild(item);
            }
        }
        
        // Store item
        this.items.push({
            element: item,
            id,
            icon
        });
        
        return item;
    }
    
    /**
     * Activate an activity bar item
     * @param {HTMLElement} item - Item element
     */
    activateItem(item) {
        // Deactivate current active item
        if (this.activeItem) {
            this.activeItem.classList.remove('active');
        }
        
        // Activate new item
        item.classList.add('active');
        this.activeItem = item;
        
        // Show corresponding panel
        this.showPanel(item.dataset.panel);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('activityBarItemActivated', {
            detail: {
                id: item.dataset.id,
                panel: item.dataset.panel
            }
        }));
    }
    
    /**
     * Show a panel
     * @param {string} panelId - Panel ID
     */
    showPanel(panelId) {
        // Hide all panels
        const panels = document.querySelectorAll('.sidebar-panel');
        panels.forEach(panel => {
            panel.classList.add('hidden');
            panel.classList.remove('active');
        });
        
        // Show selected panel
        const panel = document.querySelector(`.sidebar-panel[data-panel="${panelId}"]`);
        if (panel) {
            panel.classList.remove('hidden');
            panel.classList.add('active');
        }
    }
    
    /**
     * Get active item
     * @returns {HTMLElement} Active item element
     */
    getActiveItem() {
        return this.activeItem;
    }
    
    /**
     * Get item by ID
     * @param {string} id - Item ID
     * @returns {HTMLElement} Item element
     */
    getItemById(id) {
        const item = this.items.find(item => item.element.dataset.id === id);
        return item ? item.element : null;
    }
    
    /**
     * Activate item by ID
     * @param {string} id - Item ID
     */
    activateItemById(id) {
        const item = this.getItemById(id);
        if (item) {
            this.activateItem(item);
        }
    }
} 
