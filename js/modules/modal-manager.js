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
    init() {
        if (!this.container || !this.content) {
            console.error('Modal container not found');
            return;
        }
        this.addEventListeners();
    }
    addEventListeners() {
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                if (this.onCancel) {
                    this.onCancel();
                }
                this.hide();
            });
        }
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                if (this.onConfirm) {
                    this.onConfirm();
                }
                this.hide();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }
    show(options = {}) {
        const { title, body, onConfirm, onCancel, showCancel = true } = options;
        if (this.title) {
            this.title.textContent = title || 'Modal';
        }
        if (this.body) {
            this.body.innerHTML = body || '';
        }
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        if (this.cancelBtn) {
            this.cancelBtn.style.display = showCancel ? 'block' : 'none';
        }
        requestAnimationFrame(() => {
            this.container.style.display = 'flex';
            requestAnimationFrame(() => {
                this.container.classList.add('active');
            });
        });
        setTimeout(() => {
            const firstInput = this.body.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 200);
    }
    hide() {
        this.container.classList.remove('active');
        this.container.addEventListener('transitionend', () => {
            if (!this.container.classList.contains('active')) {
                this.container.style.display = 'none';
                this.onConfirm = null;
                this.onCancel = null;
                if (this.body) {
                    this.body.innerHTML = '';
                }
                if (this.cancelBtn) {
                    this.cancelBtn.style.display = 'block';
                }
            }
        }, { once: true });
    }
    isVisible() {
        return this.container.classList.contains('active');
    }
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
    alert(options = {}) {
        const { title, message, onConfirm } = options;
        this.show({
            title: title || 'Alert',
            body: `<p class="mb-4">${message || ''}</p>`,
            onConfirm,
            showCancel: false
        });
    }
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

