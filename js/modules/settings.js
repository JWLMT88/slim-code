class Settings {
    constructor() {
        this.container = document.querySelector('.settings-container');
        this.defaultSettings = {
            editor: {
                theme: 'vs-dark',
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                tabSize: 4,
                insertSpaces: true,
                wordWrap: 'off',
                lineNumbers: 'on',
                minimap: true,
                autoSave: false,
                formatOnSave: false,
                formatOnPaste: false,
                formatOnType: false
            },
            ui: {
                sidebarPosition: 'left',
                sidebarWidth: 250,
                showStatusBar: true,
                showActivityBar: true,
                showLineEndings: false,
                showWhitespace: false
            },
            keybindings: {
                preset: 'default'
            }
        };
        this.settings = {};
        this.init();
    }
    init() {
        this.loadSettings();
        if (this.container) {
            this.renderSettings();
        }
        this.applySettings();
    }
    loadSettings() {
        const savedSettings = localStorage.getItem('slim-code-editor-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                this.settings = this.mergeSettings(this.defaultSettings, parsed);
            } catch (error) {
                console.error('Error loading settings:', error);
                this.settings = { ...this.defaultSettings };
            }
        } else {
            this.settings = { ...this.defaultSettings };
        }
    }
    saveSettings() {
        localStorage.setItem('slim-code-editor-settings', JSON.stringify(this.settings));
        this.applySettings();
    }
    mergeSettings(defaults, userSettings) {
        const result = { ...defaults };
        for (const key in userSettings) {
            if (typeof userSettings[key] === 'object' && userSettings[key] !== null && key in defaults) {
                result[key] = this.mergeSettings(defaults[key], userSettings[key]);
            } else if (key in defaults) {
                result[key] = userSettings[key];
            }
        }
        return result;
    }
    applySettings() {
        if (window.slimCodeEditor && window.slimCodeEditor.editor) {
            const editorSettings = this.settings.editor;
            window.slimCodeEditor.editor.updateOptions({
                theme: editorSettings.theme,
                fontSize: editorSettings.fontSize,
                fontFamily: editorSettings.fontFamily,
                tabSize: editorSettings.tabSize,
                insertSpaces: editorSettings.insertSpaces,
                wordWrap: editorSettings.wordWrap,
                lineNumbers: editorSettings.lineNumbers,
                minimap: {
                    enabled: editorSettings.minimap
                }
            });
        }
        const uiSettings = this.settings.ui;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            if (uiSettings.sidebarPosition === 'right') {
                document.body.classList.add('sidebar-right');
            } else {
                document.body.classList.remove('sidebar-right');
            }
            sidebar.style.width = `${uiSettings.sidebarWidth}px`;
        }
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            statusBar.style.display = uiSettings.showStatusBar ? 'flex' : 'none';
        }
        const activityBar = document.querySelector('.activity-bar');
        if (activityBar) {
            activityBar.style.display = uiSettings.showActivityBar ? 'flex' : 'none';
        }
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));
    }
    renderSettings() {
        if (!this.container) return;
        this.container.innerHTML = '';
        const editorSection = this.createSettingsSection('Editor Settings');
        const uiSection = this.createSettingsSection('UI Settings');
        const keybindingsSection = this.createSettingsSection('Keybindings');
        this.addSelectSetting(editorSection, 'Theme', 'editor.theme', [
            { value: 'vs', label: 'Light' },
            { value: 'vs-dark', label: 'Dark' },
            { value: 'hc-black', label: 'High Contrast Dark' }
        ]);
        this.addNumberSetting(editorSection, 'Font Size', 'editor.fontSize', 8, 32);
        this.addTextSetting(editorSection, 'Font Family', 'editor.fontFamily');
        this.addNumberSetting(editorSection, 'Tab Size', 'editor.tabSize', 1, 8);
        this.addCheckboxSetting(editorSection, 'Insert Spaces', 'editor.insertSpaces');
        this.addSelectSetting(editorSection, 'Word Wrap', 'editor.wordWrap', [
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'On' },
            { value: 'wordWrapColumn', label: 'Column' },
            { value: 'bounded', label: 'Bounded' }
        ]);
        this.addSelectSetting(editorSection, 'Line Numbers', 'editor.lineNumbers', [
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
            { value: 'relative', label: 'Relative' }
        ]);
        this.addCheckboxSetting(editorSection, 'Minimap', 'editor.minimap');
        this.addCheckboxSetting(editorSection, 'Auto Save', 'editor.autoSave');
        this.addCheckboxSetting(editorSection, 'Format On Save', 'editor.formatOnSave');
        this.addCheckboxSetting(editorSection, 'Format On Paste', 'editor.formatOnPaste');
        this.addCheckboxSetting(editorSection, 'Format On Type', 'editor.formatOnType');
        this.addSelectSetting(uiSection, 'Sidebar Position', 'ui.sidebarPosition', [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
        ]);
        this.addNumberSetting(uiSection, 'Sidebar Width', 'ui.sidebarWidth', 150, 500);
        this.addCheckboxSetting(uiSection, 'Show Status Bar', 'ui.showStatusBar');
        this.addCheckboxSetting(uiSection, 'Show Activity Bar', 'ui.showActivityBar');
        this.addCheckboxSetting(uiSection, 'Show Line Endings', 'ui.showLineEndings');
        this.addCheckboxSetting(uiSection, 'Show Whitespace', 'ui.showWhitespace');
        this.addSelectSetting(keybindingsSection, 'Keybinding Preset', 'keybindings.preset', [
            { value: 'default', label: 'Default' },
            { value: 'vscode', label: 'VS Code' },
            { value: 'vim', label: 'Vim' },
            { value: 'emacs', label: 'Emacs' }
        ]);
        this.container.appendChild(editorSection);
        this.container.appendChild(uiSection);
        this.container.appendChild(keybindingsSection);
        const resetButton = document.createElement('button');
        resetButton.className = 'btn btn-danger mt-4';
        resetButton.textContent = 'Reset to Defaults';
        resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to defaults?')) {
                this.settings = { ...this.defaultSettings };
                this.saveSettings();
                this.renderSettings();
            }
        });
        this.container.appendChild(resetButton);
    }
    createSettingsSection(title) {
        const section = document.createElement('div');
        section.className = 'settings-section mb-6';
        const titleElement = document.createElement('h2');
        titleElement.className = 'text-lg font-semibold mb-4';
        titleElement.textContent = title;
        section.appendChild(titleElement);
        return section;
    }
    addTextSetting(container, label, path) {
        const setting = document.createElement('div');
        setting.className = 'setting-item mb-4';
        const labelElement = document.createElement('label');
        labelElement.className = 'block text-sm mb-1';
        labelElement.textContent = label;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'w-full px-2 py-1 rounded border';
        input.value = this.getSettingValue(path);
        input.addEventListener('change', () => {
            this.setSettingValue(path, input.value);
            this.saveSettings();
        });
        setting.appendChild(labelElement);
        setting.appendChild(input);
        container.appendChild(setting);
    }
    addNumberSetting(container, label, path, min, max) {
        const setting = document.createElement('div');
        setting.className = 'setting-item mb-4';
        const labelElement = document.createElement('label');
        labelElement.className = 'block text-sm mb-1';
        labelElement.textContent = label;
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'w-full px-2 py-1 rounded border';
        input.min = min;
        input.max = max;
        input.value = this.getSettingValue(path);
        input.addEventListener('change', () => {
            this.setSettingValue(path, parseInt(input.value, 10));
            this.saveSettings();
        });
        setting.appendChild(labelElement);
        setting.appendChild(input);
        container.appendChild(setting);
    }
    addCheckboxSetting(container, label, path) {
        const setting = document.createElement('div');
        setting.className = 'setting-item mb-4 flex items-center';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'mr-2';
        input.checked = this.getSettingValue(path);
        const labelElement = document.createElement('label');
        labelElement.className = 'text-sm';
        labelElement.textContent = label;
        input.addEventListener('change', () => {
            this.setSettingValue(path, input.checked);
            this.saveSettings();
        });
        setting.appendChild(input);
        setting.appendChild(labelElement);
        container.appendChild(setting);
    }
    addSelectSetting(container, label, path, options) {
        const setting = document.createElement('div');
        setting.className = 'setting-item mb-4';
        const labelElement = document.createElement('label');
        labelElement.className = 'block text-sm mb-1';
        labelElement.textContent = label;
        const select = document.createElement('select');
        select.className = 'w-full px-2 py-1 rounded border';
        const currentValue = this.getSettingValue(path);
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            if (option.value === currentValue) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
        select.addEventListener('change', () => {
            this.setSettingValue(path, select.value);
            this.saveSettings();
        });
        setting.appendChild(labelElement);
        setting.appendChild(select);
        container.appendChild(setting);
    }
    getSettingValue(path) {
        const parts = path.split('.');
        let value = this.settings;
        for (const part of parts) {
            if (value === undefined) return undefined;
            value = value[part];
        }
        return value;
    }
    setSettingValue(path, newValue) {
        const parts = path.split('.');
        let current = this.settings;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = newValue;
    }
} 

