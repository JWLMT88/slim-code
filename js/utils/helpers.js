// File system helpers
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileIcon(filename) {
    const ext = getFileExtension(filename);
    return FILE_ICONS[ext] || 'insert_drive_file';
}

function getFileLanguage(filename) {
    const ext = getFileExtension(filename);
    return LANGUAGE_MAP[ext] || 'plaintext';
}

function createElement(tag, className, innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    element.style.transition = `opacity ${duration}ms`;
    setTimeout(() => element.style.opacity = '1', 10);
}

function fadeOut(element, duration = 300) {
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '0';
    setTimeout(() => element.style.display = 'none', duration);
}

function normalizePath(path) {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

function getParentPath(path) {
    const normalized = normalizePath(path);
    return normalized.substring(0, normalized.lastIndexOf('/'));
}

function getFileName(path) {
    const normalized = normalizePath(path);
    return normalized.split('/').pop();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return defaultValue;
    }
}

function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
}

function registerShortcut(key, callback) {
    document.addEventListener('keydown', (e) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        
        if (modifier && e.key.toLowerCase() === key.toLowerCase()) {
            e.preventDefault();
            callback(e);
        }
    });
} 