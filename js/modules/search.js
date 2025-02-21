class Search {
    constructor() {
        this.input = document.getElementById('search-input');
        this.resultsContainer = document.getElementById('search-results');
        this.caseSensitive = document.getElementById('search-case-sensitive');
        this.wholeWord = document.getElementById('search-whole-word');
        this.regex = document.getElementById('search-regex');
        this.debounceTimeout = null;
        window.search = this;
        this.init();
    }

    init() {
        this.initEventListeners();
    }

    initEventListeners() {
        this.input.addEventListener('input', () => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => this.performSearch(), 300);
        });

        // Search options
        [this.caseSensitive, this.wholeWord, this.regex].forEach(option => {
            option.addEventListener('change', () => this.performSearch());
        });
    }

    performSearch() {
        const query = this.input.value;
        if (!query) {
            this.resultsContainer.innerHTML = '';
            return;
        }

        const results = this.searchInFiles(query);
        this.displayResults(results);
    }

    searchInFiles(query) {
        const results = [];
        const fileSystem = window.explorer.fileSystem;

        const searchInStructure = (structure, path = '') => {
            for (const [name, item] of Object.entries(structure)) {
                const currentPath = path ? `${path}/${name}` : name;

                if (item.type === 'directory') {
                    searchInStructure(item.children, currentPath);
                } else if (item.type === 'file') {
                    const matches = this.findMatches(item.content, query, currentPath);
                    if (matches.length > 0) {
                        results.push({
                            file: currentPath,
                            matches
                        });
                    }
                }
            }
        };

        searchInStructure(fileSystem);
        return results;
    }

    findMatches(content, query, filePath) {
        const matches = [];
        const lines = content.split('\n');
        let pattern;

        try {
            if (this.regex.checked) {
                pattern = new RegExp(query, this.caseSensitive.checked ? 'g' : 'gi');
            } else {
                const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wholeWord = this.wholeWord.checked ? `\\b${escaped}\\b` : escaped;
                pattern = new RegExp(wholeWord, this.caseSensitive.checked ? 'g' : 'gi');
            }

            lines.forEach((line, index) => {
                const lineMatches = [...line.matchAll(pattern)];
                if (lineMatches.length > 0) {
                    matches.push({
                        line: index + 1,
                        content: line,
                        positions: lineMatches.map(match => ({
                            start: match.index,
                            end: match.index + match[0].length
                        }))
                    });
                }
            });
        } catch (error) {
            console.error('Search error:', error);
        }

        return matches;
    }

    displayResults(results) {
        this.resultsContainer.innerHTML = '';

        if (results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="text-gray-400 text-sm p-4 text-center">
                    No results found
                </div>
            `;
            return;
        }

        results.forEach(result => {
            const fileElement = document.createElement('div');
            fileElement.className = 'bg-gray-800/30 rounded-lg overflow-hidden';

            fileElement.innerHTML = `
                <div class="p-2 bg-gray-800/50 flex items-center space-x-2 cursor-pointer hover:bg-gray-700/50">
                    <span class="material-icons text-sm text-gray-400">${getFileIcon(result.file)}</span>
                    <span class="text-sm">${result.file}</span>
                    <span class="text-xs text-gray-500 ml-auto">${result.matches.length} matches</span>
                </div>
                <div class="divide-y divide-gray-700/50">
                    ${result.matches.map(match => `
                        <div class="p-2 text-sm font-mono cursor-pointer hover:bg-gray-700/30" data-file="${result.file}" data-line="${match.line}">
                            <div class="flex items-center space-x-2 text-gray-400">
                                <span class="text-xs">${match.line}</span>
                                <span class="flex-1">${this.highlightMatch(match)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add click handlers
            fileElement.querySelectorAll('[data-file]').forEach(element => {
                element.addEventListener('click', () => {
                    this.openFileAtLine(
                        element.dataset.file,
                        parseInt(element.dataset.line)
                    );
                });
            });

            this.resultsContainer.appendChild(fileElement);
        });
    }

    highlightMatch(match) {
        let content = match.content;
        let offset = 0;

        match.positions.forEach(pos => {
            const start = pos.start + offset;
            const end = pos.end + offset;
            const highlight = `<span class="bg-yellow-500/30 text-yellow-200">${content.slice(start, end)}</span>`;
            content = content.slice(0, start) + highlight + content.slice(end);
            offset += highlight.length - (end - start);
        });

        return content;
    }

    openFileAtLine(filePath, line) {
        const file = window.explorer.getFileFromPath(filePath);
        if (!file) return;

        window.explorer.openFile(filePath, file).then(() => {
            if (window.editor && window.editor.editor) {
                window.editor.editor.revealLineInCenter(line);
                window.editor.editor.setPosition({ lineNumber: line, column: 1 });
                window.editor.editor.focus();
            }
        });
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Search();
}); 