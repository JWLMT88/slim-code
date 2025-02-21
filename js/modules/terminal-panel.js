class TerminalPanel {
    constructor() {
        this.panel = document.getElementById('terminal-panel');
        this.container = document.getElementById('terminal-container');
        this.toggleButton = document.getElementById('terminal-btn');
        this.clearButton = document.getElementById('terminal-clear');
        this.closeButton = document.getElementById('terminal-close');
        this.currentDirectory = '/';
        this.term = null;
        window.terminalPanel = this;
        this.init();
    }

    init() {
        this.initEventListeners();
        this.waitForDependencies();
    }

    waitForDependencies() {
        this.initTerminal();
    }

    initTerminal() {
        try {
           
            jQuery(function($, undefined) {
                $(this.container).terminal(function(command)
           
                {
                    if (command.trim()) {
                        this.executeCommand(command);
                    }
                },
                {
                    greetings: 'Welcome to simply code terminal',
                    name: 'code_terminal',
                    height: '100%',
                    prompt: () => {
                        const projectName = window.projects?.currentProject?.name || 'terminal';
                        return `[[;#98c379;]${projectName}] [[;#61afef;]${this.currentDirectory}]$ `;
                    },
                    completion: (term, command, callback) => {
                        callback(this.getCompletions(command));
                    }
                }
            )})
        } catch (error) {
            console.error('Error initializing terminal:', error);
        }

    }

    initEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggle());
        this.clearButton.addEventListener('click', () => this.clear());
        this.closeButton.addEventListener('click', () => this.hide());
    }

    toggle() {
        if (this.panel.classList.contains('hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }

    show() {
        this.panel.classList.remove('hidden');
        this.term?.focus();
        this.term?.refresh();
    }

    hide() {
        this.panel.classList.add('hidden');
    }

    clear() {
        this.term?.clear();
    }

    getCompletions(command) {
        const parts = command.split(' ');
        const currentWord = parts[parts.length - 1];
        const isFirstWord = parts.length === 1;

        if (isFirstWord) {
            return ['cd', 'ls', 'cat', 'pwd', 'clear', 'help'].filter(cmd => 
                cmd.startsWith(currentWord)
            );
        }

        // File and directory completion
        if (['cd', 'cat'].includes(parts[0])) {
            const dir = this.getFileFromPath(this.currentDirectory);
            if (!dir || dir.type !== 'directory') return [];

            return Object.keys(dir.children).filter(name => 
                name.startsWith(currentWord)
            );
        }

        return [];
    }

    async executeCommand(command) {
        const [cmd, ...args] = command.trim().split(/\s+/);

        try {
            switch (cmd) {
                case 'cd':
                    this.changeDirectory(args[0]);
                    break;
                case 'ls':
                    this.listDirectory();
                    break;
                case 'cat':
                    this.catFile(args[0]);
                    break;
                case 'pwd':
                    this.term.echo(this.currentDirectory);
                    break;
                case 'clear':
                    this.clear();
                    break;
                case 'help':
                    this.showHelp();
                    break;
                default:
                    this.term.error(`Command not found: ${cmd}`);
            }
        } catch (error) {
            this.term.error(error.message);
        }
    }

    changeDirectory(path) {
        if (!path || path === '.') return;

        if (path === '..') {
            const parts = this.currentDirectory.split('/').filter(Boolean);
            if (parts.length > 0) {
                parts.pop();
                this.currentDirectory = '/' + parts.join('/');
            }
            return;
        }

        const newPath = path.startsWith('/')
            ? path
            : `${this.currentDirectory}/${path}`.replace(/\/+/g, '/');

        const dir = this.getFileFromPath(newPath);
        if (!dir || dir.type !== 'directory') {
            throw new Error(`Directory not found: ${path}`);
        }

        this.currentDirectory = newPath;
    }

    listDirectory() {
        const dir = this.getFileFromPath(this.currentDirectory);
        if (!dir || dir.type !== 'directory') {
            throw new Error('Invalid directory');
        }

        Object.entries(dir.children).forEach(([name, item]) => {
            const color = item.type === 'directory' ? '#61afef' : '#d4d4d4';
            this.term.echo(`[[;${color};]${name}]`);
        });
    }

    catFile(path) {
        if (!path) {
            throw new Error('File path required');
        }

        const filePath = path.startsWith('/')
            ? path
            : `${this.currentDirectory}/${path}`.replace(/\/+/g, '/');

        const file = this.getFileFromPath(filePath);
        if (!file || file.type !== 'file') {
            throw new Error(`File not found: ${path}`);
        }

        this.term.echo(file.content);
    }

    showHelp() {
        const commands = [
            ['cd <dir>', 'Change directory'],
            ['ls', 'List directory contents'],
            ['cat <file>', 'Display file contents'],
            ['pwd', 'Print working directory'],
            ['clear', 'Clear terminal'],
            ['help', 'Show this help message']
        ];

        this.term.echo('Available commands:');
        commands.forEach(([cmd, desc]) => {
            this.term.echo(`  [[;#d19a66;]${cmd.padEnd(15)}] ${desc}`);
        });
    }

    getFileFromPath(path) {
        const parts = path.split('/').filter(Boolean);
        let current = window.explorer.fileSystem;

        for (const part of parts) {
            if (!current[part]) return null;
            current = current[part].type === 'directory' ? current[part].children : current[part];
        }

        return current;
    }
}

// Initialize terminal panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TerminalPanel();
}); 