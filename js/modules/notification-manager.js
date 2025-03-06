/**
 * NotificationManager Class
 * Manages notifications in the editor
 */
class NotificationManager {
    constructor() {
        this.container = document.querySelector('.notifications-container');
        this.notifications = [];
        this.autoHideDelay = 5000; // 5 seconds
        
        this.init();
    }
    
    /**
     * Initialize notification manager
     */
    init() {
        if (!this.container) {
            // Create container if it doesn't exist
            this.container = document.createElement('div');
            this.container.className = 'notifications-container fixed bottom-4 right-4 space-y-2 z-50';
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * Show a notification
     * @param {Object} options - Notification options
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {string} options.type - Notification type (info, success, warning, error)
     * @param {boolean} options.autoHide - Whether to auto-hide the notification
     * @param {number} options.delay - Auto-hide delay in milliseconds
     * @returns {HTMLElement} The notification element
     */
    show(options) {
        const { title, message, type = 'info', autoHide = true, delay = this.autoHideDelay } = options;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Get icon based on type
        const icon = this.getIcon(type);
        
        // Create notification content
        notification.innerHTML = `
            <div class="notification-icon">
                <span class="material-icons">${icon}</span>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <span class="material-icons text-xs">close</span>
            </button>
        `;
        
        // Add notification to container
        this.container.appendChild(notification);
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Add close event
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide(notification);
            });
        }
        
        // Auto-hide after delay
        if (autoHide) {
            setTimeout(() => {
                this.hide(notification);
            }, delay);
        }
        
        return notification;
    }
    
    /**
     * Hide a notification
     * @param {HTMLElement} notification - Notification element to hide
     */
    hide(notification) {
        if (!notification) return;
        
        // Add fade-out animation
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Remove after animation
        setTimeout(() => {
            notification.remove();
            
            // Remove from notifications array
            const index = this.notifications.indexOf(notification);
            if (index !== -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    /**
     * Hide all notifications
     */
    hideAll() {
        // Create a copy of the array to avoid issues when removing items
        const notificationsCopy = [...this.notifications];
        
        notificationsCopy.forEach(notification => {
            this.hide(notification);
        });
    }
    
    /**
     * Get icon based on notification type
     * @param {string} type - Notification type
     * @returns {string} Material icon name
     */
    getIcon(type) {
        const icons = {
            'info': 'info',
            'success': 'check_circle',
            'warning': 'warning',
            'error': 'error'
        };
        
        return icons[type] || icons.info;
    }
} 