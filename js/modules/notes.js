/**
 * Notes Class
 * Manages notes functionality in the editor
 */
class Notes {
    constructor() {
        this.container = document.querySelector('.notes-container');
        this.addButton = document.querySelector('.panel-header [title="Add Note"]');
        this.notes = [];
        
        this.init();
    }
    
    /**
     * Initialize notes functionality
     */
    init() {
        if (!this.container) return;
        
        // Load saved notes
        this.loadNotes();
        
        // Add event listener for add note button
        if (this.addButton) {
            this.addButton.addEventListener('click', () => {
                this.addNote();
            });
        }
    }
    
    /**
     * Load notes from localStorage
     */
    loadNotes() {
        const savedNotes = localStorage.getItem('slim-code-editor-notes');
        if (savedNotes) {
            try {
                this.notes = JSON.parse(savedNotes);
                this.renderNotes();
            } catch (error) {
                console.error('Error loading notes:', error);
            }
        }
    }
    
    /**
     * Save notes to localStorage
     */
    saveNotes() {
        localStorage.setItem('slim-code-editor-notes', JSON.stringify(this.notes));
    }
    
    /**
     * Render notes in the container
     */
    renderNotes() {
        if (!this.container) return;
        
        // Clear container
        this.container.innerHTML = '';
        
        if (this.notes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-sm text-editor-text-muted italic';
            emptyMessage.textContent = 'No notes yet. Click the + button to add a note.';
            this.container.appendChild(emptyMessage);
            return;
        }
        
        // Render each note
        this.notes.forEach((note, index) => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-item';
            noteElement.innerHTML = `
                <div class="note-title">${note.title}</div>
                <div class="note-content">${note.content}</div>
                <div class="note-footer">
                    <span>${this.formatDate(note.date)}</span>
                    <div class="flex space-x-2">
                        <button class="edit-note" title="Edit Note">
                            <span class="material-icons text-xs">edit</span>
                        </button>
                        <button class="delete-note" title="Delete Note">
                            <span class="material-icons text-xs">delete</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            noteElement.querySelector('.edit-note').addEventListener('click', () => {
                this.editNote(index);
            });
            
            noteElement.querySelector('.delete-note').addEventListener('click', () => {
                this.deleteNote(index);
            });
            
            this.container.appendChild(noteElement);
        });
    }
    
    /**
     * Add a new note
     */
    addNote() {
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.show({
                title: 'Add Note',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Title</label>
                            <input type="text" id="note-title" class="w-full" placeholder="Note Title">
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Content</label>
                            <textarea id="note-content" class="w-full h-32" placeholder="Note Content"></textarea>
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    const title = document.getElementById('note-title').value;
                    const content = document.getElementById('note-content').value;
                    
                    if (title && content) {
                        this.notes.push({
                            title,
                            content,
                            date: new Date().toISOString()
                        });
                        
                        this.saveNotes();
                        this.renderNotes();
                    }
                }
            });
        }
    }
    
    /**
     * Edit a note
     * @param {number} index - Note index
     */
    editNote(index) {
        if (index < 0 || index >= this.notes.length) return;
        
        const note = this.notes[index];
        
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.show({
                title: 'Edit Note',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Title</label>
                            <input type="text" id="note-title" class="w-full" value="${this.escapeHtml(note.title)}">
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs text-editor-text-muted">Content</label>
                            <textarea id="note-content" class="w-full h-32">${this.escapeHtml(note.content)}</textarea>
                        </div>
                    </div>
                `,
                onConfirm: () => {
                    const title = document.getElementById('note-title').value;
                    const content = document.getElementById('note-content').value;
                    
                    if (title && content) {
                        this.notes[index] = {
                            ...note,
                            title,
                            content,
                            date: new Date().toISOString()
                        };
                        
                        this.saveNotes();
                        this.renderNotes();
                    }
                }
            });
        }
    }
    
    /**
     * Delete a note
     * @param {number} index - Note index
     */
    deleteNote(index) {
        if (index < 0 || index >= this.notes.length) return;
        
        if (window.slimCodeEditor && window.slimCodeEditor.modal) {
            window.slimCodeEditor.modal.confirm({
                title: 'Delete Note',
                message: 'Are you sure you want to delete this note?',
                onConfirm: () => {
                    this.notes.splice(index, 1);
                    this.saveNotes();
                    this.renderNotes();
                }
            });
        } else {
            const confirm = window.confirm('Are you sure you want to delete this note?');
            if (confirm) {
                this.notes.splice(index, 1);
                this.saveNotes();
                this.renderNotes();
            }
        }
    }
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    /**
     * Escape HTML special characters
     * @param {string} html - HTML string to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
}

// Initialize notes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Notes();
}); 