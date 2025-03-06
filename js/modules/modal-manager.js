/**
 * ModalManager Class
 * Manages modal dialogs in the editor
 */
class ModalManager {
    constructor() {
        this.container = document.querySelector('.modal-container');
        this.content = document.querySelector('.modal-content');
        this.title = document.querySelector('.modal-title');
        this.body = document.querySelector('.modal-body');
        this.confirmBtn = document.querySelector('.modal-confirm');
        this.cancelBtn = document.querySelector('.modal-cancel');
        this.closeBtn = document.querySelector('.modal-close');
        
        this.onConfirm = null;
        this.onCancel = null;
        
        this.init();
    }
    
    /**
     * Initialize modal manager
     */
    init() {
        if (!this.container || !this.content) {
            console.error('Modal container not found');
            return;
        }
        
        this.addEventListeners();
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Close modal when clicking outside
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
        
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Cancel button
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                if (this.onCancel) {
                    this.onCancel();
                }
                this.hide();
            });
        }
        
        // Confirm button
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                if (this.onConfirm) {
                    this.onConfirm();
                }
                this.hide();
            });
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }
    
    /**
     * Show modal
     * @param {Object} options - Modal options
     * @param {string} options.title - Modal title
     * @param {string} options.body - Modal body content
     * @param {Function} options.onConfirm - Confirm callback
     * @param {Function} options.onCancel - Cancel callback
     * @param {boolean} options.showCancel - Whether to show cancel button
     */
    show(options = {}) {
        const { title, body, onConfirm, onCancel, showCancel = true } = options;
        
        // Set title
        if (this.title) {
            this.title.textContent = title || 'Modal';
        }
        
        // Set body content
        if (this.body) {
            this.body.innerHTML = body || '';
        }
        
        // Store callbacks
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        
        // Show/hide cancel button
        if (this.cancelBtn) {
            this.cancelBtn.style.display = showCancel ? 'block' : 'none';
        }
        
        // Show modal with transition
        requestAnimationFrame(() => {
            this.container.style.display = 'flex';
            requestAnimationFrame(() => {
                this.container.classList.add('active');
            });
        });
        
        // Focus first input if present
        setTimeout(() => {
            const firstInput = this.body.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 200);
    }
    
    /**
     * Hide modal
     */
    hide() {
        // Hide modal with transition
        this.container.classList.remove('active');
        
        // Wait for transition to complete
        this.container.addEventListener('transitionend', () => {
            if (!this.container.classList.contains('active')) {
                this.container.style.display = 'none';
                
                // Clear callbacks
                this.onConfirm = null;
                this.onCancel = null;
                
                // Clear body content
                if (this.body) {
                    this.body.innerHTML = '';
                }
                
                // Show cancel button (restore default state)
                if (this.cancelBtn) {
                    this.cancelBtn.style.display = 'block';
                }
            }
        }, { once: true });
    }
    
    /**
     * Check if modal is visible
     * @returns {boolean} Whether modal is visible
     */
    isVisible() {
        return this.container.classList.contains('active');
    }
    
    /**
     * Show confirmation dialog
     * @param {Object} options - Dialog options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {Function} options.onConfirm - Confirm callback
     * @param {Function} options.onCancel - Cancel callback
     */
    confirm(options = {}) {
        const { title, message, onConfirm, onCancel } = options;
        
        this.show({
            title: title || 'Confirm',
            body: `<p class="mb-4">${message || 'Are you sure?'}</p>`,
            onConfirm,
            onCancel,
            showCancel: true
        });
    }
    
    /**
     * Show alert dialog
     * @param {Object} options - Dialog options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {Function} options.onConfirm - Confirm callback
     */
    alert(options = {}) {
        const { title, message, onConfirm } = options;
        
        this.show({
            title: title || 'Alert',
            body: `<p class="mb-4">${message || ''}</p>`,
            onConfirm,
            showCancel: false
        });
    }
    
    /**
     * Show prompt dialog
     * @param {Object} options - Dialog options
     * @param {string} options.title - Dialog title
     * @param {string} options.message - Dialog message
     * @param {string} options.defaultValue - Default input value
     * @param {Function} options.onConfirm - Confirm callback
     * @param {Function} options.onCancel - Cancel callback
     */
    prompt(options = {}) {
        const { title, message, defaultValue = '', onConfirm, onCancel } = options;
        
        this.show({
            title: title || 'Prompt',
            body: `
                <div class="space-y-4">
                    ${message ? `<p>${message}</p>` : ''}
                    <input type="text" class="w-full" value="${defaultValue}">
                </div>
            `,
            onConfirm: () => {
                const value = this.body.querySelector('input').value;
                if (onConfirm) {
                    onConfirm(value);
                }
            },
            onCancel,
            showCancel: true
        });
    }
} 