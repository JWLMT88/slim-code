/**
 * Search Class
 * Manages search functionality in the editor
 */
class Search {
    constructor() {
        this.container = document.querySelector('.search-container');
        this.input = this.container ? this.container.querySelector('.search-input') : null;
        this.resultsContainer = this.container ? this.container.querySelector('.search-results') : null;
        this.matchCaseCheckbox = this.container ? this.container.querySelector('input[type="checkbox"]:nth-child(1)') : null;
        this.wholeWordCheckbox = this.container ? this.container.querySelector('input[type="checkbox"]:nth-child(2)') : null;
        this.regexCheckbox = this.container ? this.container.querySelector('input[type="checkbox"]:nth-child(3)') : null;
        
        this.init();
    }
    
    /**
     * Initialize search functionality
     */
    init() {
        if (!this.container || !this.input || !this.resultsContainer) return;
        
        // Add event listeners
        this.input.addEventListener('input', () => {
            this.search();
        });
        
        // Add event listeners for checkboxes
        if (this.matchCaseCheckbox) {
            this.matchCaseCheckbox.addEventListener('change', () => {
                this.search();
            });
        }
        
        if (this.wholeWordCheckbox) {
            this.wholeWordCheckbox.addEventListener('change', () => {
                this.search();
            });
        }
        
        if (this.regexCheckbox) {
            this.regexCheckbox.addEventListener('change', () => {
                this.search();
            });
        }
    }
    
    /**
     * Perform search
     */
    search() {
        const query = this.input.value.trim();
        
        // Clear results if query is empty
        if (!query) {
            this.clearResults();
            return;
        }
        
        // Get search options
        const matchCase = this.matchCaseCheckbox ? this.matchCaseCheckbox.checked : false;
        const wholeWord = this.wholeWordCheckbox ? this.wholeWordCheckbox.checked : false;
        const useRegex = this.regexCheckbox ? this.regexCheckbox.checked : false;
        
        // Get project files
        if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer || !window.slimCodeEditor.fileExplorer.currentProject) {
            this.showNoResults('No project open');
            return;
        }
        
        const project = window.slimCodeEditor.fileExplorer.currentProject;
        const results = this.searchInProject(project, query, { matchCase, wholeWord, useRegex });
        
        // Display results
        this.displayResults(results);
    }
    
    /**
     * Search in project files
     * @param {Object} project - Project object
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Search results
     */
    searchInProject(project, query, options) {
        const results = [];
        
        // Create regex for search
        let regex;
        try {
            if (options.useRegex) {
                regex = new RegExp(query, options.matchCase ? 'g' : 'gi');
            } else {
                let pattern = query;
                
                // Escape regex special characters if not using regex
                if (!options.useRegex) {
                    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }
                
                // Add word boundaries if whole word is checked
                if (options.wholeWord) {
                    pattern = `\\b${pattern}\\b`;
                }
                
                regex = new RegExp(pattern, options.matchCase ? 'g' : 'gi');
            }
        } catch (error) {
            this.showNoResults(`Invalid regex: ${error.message}`);
            return results;
        }
        
        // Search in files
        this.searchInFolder(project.fileSystem, '', regex, results);
        
        return results;
    }
    
    /**
     * Search in folder recursively
     * @param {Object} folder - Folder object
     * @param {string} path - Current path
     * @param {RegExp} regex - Search regex
     * @param {Array} results - Results array
     */
    searchInFolder(folder, path, regex, results) {
        const folderPath = path ? `${path}/${folder.name}` : folder.name;
        
        if (folder.children && folder.children.length > 0) {
            folder.children.forEach(child => {
                if (child.type === 'folder') {
                    this.searchInFolder(child, folderPath, regex, results);
                } else {
                    this.searchInFile(child, folderPath, regex, results);
                }
            });
        }
    }
    
    /**
     * Search in file
     * @param {Object} file - File object
     * @param {string} path - Current path
     * @param {RegExp} regex - Search regex
     * @param {Array} results - Results array
     */
    searchInFile(file, path, regex, results) {
        const filePath = `${path}/${file.name}`;
        const content = file.content || '';
        
        // Reset regex lastIndex
        regex.lastIndex = 0;
        
        // Find all matches
        const lines = content.split('\n');
        lines.forEach((line, lineIndex) => {
            // Reset regex lastIndex for each line
            regex.lastIndex = 0;
            
            let match;
            while ((match = regex.exec(line)) !== null) {
                results.push({
                    path: filePath,
                    line: lineIndex + 1,
                    column: match.index + 1,
                    lineContent: line,
                    matchText: match[0],
                    matchStart: match.index,
                    matchEnd: match.index + match[0].length
                });
            }
        });
    }
    
    /**
     * Display search results
     * @param {Array} results - Search results
     */
    displayResults(results) {
        // Clear previous results
        this.clearResults();
        
        if (results.length === 0) {
            this.showNoResults();
            return;
        }
        
        // Group results by file
        const groupedResults = this.groupResultsByFile(results);
        
        // Create results elements
        Object.entries(groupedResults).forEach(([path, fileResults]) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'mb-4';
            
            // File path
            const pathElement = document.createElement('div');
            pathElement.className = 'search-result-path mb-1';
            pathElement.textContent = path;
            fileElement.appendChild(pathElement);
            
            // File results
            fileResults.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result';
                
                // Line number
                const lineElement = document.createElement('div');
                lineElement.className = 'text-xs text-editor-text-muted';
                lineElement.textContent = `Line ${result.line}`;
                resultElement.appendChild(lineElement);
                
                // Line content with highlighted match
                const contentElement = document.createElement('div');
                contentElement.className = 'search-result-line';
                
                // Highlight match
                const beforeMatch = result.lineContent.substring(0, result.matchStart);
                const match = result.lineContent.substring(result.matchStart, result.matchEnd);
                const afterMatch = result.lineContent.substring(result.matchEnd);
                
                contentElement.innerHTML = `${this.escapeHtml(beforeMatch)}<span class="search-result-match">${this.escapeHtml(match)}</span>${this.escapeHtml(afterMatch)}`;
                
                resultElement.appendChild(contentElement);
                
                // Add click event to open file
                resultElement.addEventListener('click', () => {
                    this.openResult(result);
                });
                
                fileElement.appendChild(resultElement);
            });
            
            this.resultsContainer.appendChild(fileElement);
        });
    }
    
    /**
     * Group results by file
     * @param {Array} results - Search results
     * @returns {Object} Grouped results
     */
    groupResultsByFile(results) {
        const grouped = {};
        
        results.forEach(result => {
            if (!grouped[result.path]) {
                grouped[result.path] = [];
            }
            
            grouped[result.path].push(result);
        });
        
        return grouped;
    }
    
    /**
     * Open a search result
     * @param {Object} result - Search result
     */
    openResult(result) {
        if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer) return;
        
        // Open file
        window.slimCodeEditor.fileExplorer.openFile(result.path);
        
        // Set cursor position
        if (window.slimCodeEditor.editor && window.slimCodeEditor.editor.editor) {
            setTimeout(() => {
                window.slimCodeEditor.editor.editor.setPosition({
                    lineNumber: result.line,
                    column: result.column
                });
                
                window.slimCodeEditor.editor.editor.revealPositionInCenter({
                    lineNumber: result.line,
                    column: result.column
                });
                
                // Focus editor
                window.slimCodeEditor.editor.editor.focus();
            }, 100);
        }
    }
    
    /**
     * Show no results message
     * @param {string} message - Message to display
     */
    showNoResults(message = 'No results found') {
        const noResults = document.createElement('div');
        noResults.className = 'text-sm text-editor-text-muted italic';
        noResults.textContent = message;
        
        this.resultsContainer.appendChild(noResults);
    }
    
    /**
     * Clear search results
     */
    clearResults() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '';
        }
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
