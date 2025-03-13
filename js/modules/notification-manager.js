class NotificationManager {
    constructor() {
        this.container = document.querySelector('.notifications-container');
        this.notifications = [];
        this.autoHideDelay = 5000; 
        this.init();
    }
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'notifications-container fixed bottom-4 right-4 space-y-2 z-50';
            document.body.appendChild(this.container);
        }
    }
    show(options) {
        const { title, message, type = 'info', autoHide = true, delay = this.autoHideDelay } = options;
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        const icon = this.getIcon(type);
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
        this.container.appendChild(notification);
        this.notifications.push(notification);
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide(notification);
            });
        }
        if (autoHide) {
            setTimeout(() => {
                this.hide(notification);
            }, delay);
        }
        return notification;
    }
    hide(notification) {
        if (!notification) return;
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
            notification.remove();
            const index = this.notifications.indexOf(notification);
            if (index !== -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    hideAll() {
        const notificationsCopy = [...this.notifications];
        notificationsCopy.forEach(notification => {
            this.hide(notification);
        });
    }
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

