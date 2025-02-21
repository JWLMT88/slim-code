class Notes {
    constructor() {
        this.container = document.getElementById('file-notes');
        this.addButton = document.querySelector('[data-content="notes"] [title="Add Note"]');
        this.notes = this.loadNotes();
        window.notes = this;
        this.init();
    }

    init() {
        this.initEventListeners();
        this.renderNotes();
    }

    initEventListeners() {
        this.addButton.addEventListener('click', () => this.addNote());

        // Listen for active tab changes
        window.addEventListener('tabChange', (e) => {
            this.renderNotes(e.detail.path);
        });
    }

    loadNotes() {
        return getFromLocalStorage('fileNotes', {});
    }

    saveNotes() {
        saveToLocalStorage('fileNotes', this.notes);
    }

    addNote(filePath = window.tabs?.activeTab) {
        if (!filePath) {
            window.app.showNotification('No File Selected', 'Please open a file to add notes', 'warning');
            return;
        }

        const note = {
            id: Date.now(),
            content: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            line: window.editor?.editor?.getPosition()?.lineNumber || 0
        };

        if (!this.notes[filePath]) {
            this.notes[filePath] = [];
        }

        this.notes[filePath].unshift(note);
        this.saveNotes();
        this.renderNotes(filePath);

        // Focus the new note
        setTimeout(() => {
            const textarea = document.querySelector(`[data-note-id="${note.id}"] textarea`);
            if (textarea) {
                textarea.focus();
            }
        }, 0);
    }

    deleteNote(filePath, noteId) {
        if (!this.notes[filePath]) return;

        this.notes[filePath] = this.notes[filePath].filter(note => note.id !== noteId);
        if (this.notes[filePath].length === 0) {
            delete this.notes[filePath];
        }

        this.saveNotes();
        this.renderNotes(filePath);
    }

    updateNote(filePath, noteId, content) {
        if (!this.notes[filePath]) return;

        const note = this.notes[filePath].find(n => n.id === noteId);
        if (note) {
            note.content = content;
            note.modified = new Date().toISOString();
            this.saveNotes();
        }
    }

    renderNotes(filePath = window.tabs?.activeTab) {
        this.container.innerHTML = '';

        if (!filePath) {
            this.container.innerHTML = `
                <div class="text-gray-400 text-sm p-4 text-center">
                    Open a file to view and add notes
                </div>
            `;
            return;
        }

        const fileNotes = this.notes[filePath] || [];
        if (fileNotes.length === 0) {
            this.container.innerHTML = `
                <div class="text-gray-400 text-sm p-4 text-center">
                    No notes for this file
                </div>
            `;
            return;
        }

        fileNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'bg-gray-800/30 rounded-lg p-3 space-y-2';
            noteElement.dataset.noteId = note.id;

            noteElement.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-500">Line ${note.line}</span>
                        <span class="text-xs text-gray-500">${this.formatDate(note.modified)}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="p-1 hover:bg-gray-700 rounded goto-line-btn" title="Go to Line">
                            <span class="material-icons text-sm">location_searching</span>
                        </button>
                        <button class="p-1 hover:bg-gray-700 rounded delete-note-btn" title="Delete Note">
                            <span class="material-icons text-sm">delete</span>
                        </button>
                    </div>
                </div>
                <textarea
                    class="w-full bg-gray-900/20 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-editor-accent text-sm"
                    rows="3"
                    placeholder="Enter your note here..."
                >${note.content}</textarea>
            `;

            // Add event listeners
            const textarea = noteElement.querySelector('textarea');
            textarea.addEventListener('input', debounce(() => {
                this.updateNote(filePath, note.id, textarea.value);
            }, 500));

            noteElement.querySelector('.goto-line-btn').addEventListener('click', () => {
                if (window.editor && window.editor.editor) {
                    window.editor.editor.revealLineInCenter(note.line);
                    window.editor.editor.setPosition({ lineNumber: note.line, column: 1 });
                    window.editor.editor.focus();
                }
            });

            noteElement.querySelector('.delete-note-btn').addEventListener('click', () => {
                this.deleteNote(filePath, note.id);
            });

            this.container.appendChild(noteElement);
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // less than 1 minute
            return 'just now';
        } else if (diff < 3600000) { // less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Notes();
}); 