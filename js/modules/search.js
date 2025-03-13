class Search {
    constructor() {
        this.container = document.querySelector('.search-container');
        this.input = this.container ? this.container.querySelector('.search-input') : null;
        this.resultsContainer = this.container ? this.container.querySelector('.search-results') : null;
        this.placeholder = this.container ? this.container.querySelector('.search-placeholder') : null;
        this.searchCount = this.container ? this.container.querySelector('.search-count') : null;
        this.caseToggle = this.container ? this.container.querySelector('.search-case-toggle') : null;
        this.wordToggle = this.container ? this.container.querySelector('.search-word-toggle') : null;
        this.regexToggle = this.container ? this.container.querySelector('.search-regex-toggle') : null;
        this.clearButton = document.querySelector('.search-action-btn[title="Clear Search"]');
        this.refreshButton = document.querySelector('.search-action-btn[title="Refresh Search"]');
        this.prevButton = this.container ? this.container.querySelector('.search-prev') : null;
        this.nextButton = this.container ? this.container.querySelector('.search-next') : null;
        this.filterTabs = this.container ? this.container.querySelectorAll('.search-filter-tab') : null;
        this.scopePath = this.container ? this.container.querySelector('.search-scope-path') : null;
        this.scopeChangeButton = this.container ? this.container.querySelector('.search-scope-change') : null;
        this.currentResults = [];
        this.currentIndex = -1;
        this.activeFilter = 'all';
        this.searchScope = 'project';
        this.searchTimeout = null;
        this.isSearching = false;
        this.init();
    }
    init() {
        if (!this.container || !this.input || !this.resultsContainer) return;
        this.input.addEventListener('input', () => {
            this.debounceSearch();
        });
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.search();
            } else if (e.key === 'Escape') {
                this.clearSearch();
            }
        });
        if (this.caseToggle) {
            this.caseToggle.addEventListener('click', () => {
                this.toggleOption(this.caseToggle);
                this.debounceSearch();
            });
        }
        if (this.wordToggle) {
            this.wordToggle.addEventListener('click', () => {
                this.toggleOption(this.wordToggle);
                this.debounceSearch();
            });
        }
        if (this.regexToggle) {
            this.regexToggle.addEventListener('click', () => {
                this.toggleOption(this.regexToggle);
                this.debounceSearch();
            });
        }
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => {
                this.search();
            });
        }
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                this.navigateResults('prev');
            });
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                this.navigateResults('next');
            });
        }
        if (this.filterTabs) {
            this.filterTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.setActiveFilter(tab.textContent.toLowerCase());
                });
            });
        }
        if (this.scopeChangeButton) {
            this.scopeChangeButton.addEventListener('click', () => {
                this.changeSearchScope();
            });
        }
    }
    toggleOption(button) {
        button.classList.toggle('active');
    }
    setActiveFilter(filter) {
        this.activeFilter = filter;
        if (this.filterTabs) {
            this.filterTabs.forEach(tab => {
                if (tab.textContent.toLowerCase() === filter) {
                    tab.classList.add('active');
                    tab.classList.add('border-editor-accent');
                    tab.classList.add('text-editor-accent');
                    tab.classList.remove('border-transparent');
                    tab.classList.remove('text-editor-text-muted');
                } else {
                    tab.classList.remove('active');
                    tab.classList.remove('border-editor-accent');
                    tab.classList.remove('text-editor-accent');
                    tab.classList.add('border-transparent');
                    tab.classList.add('text-editor-text-muted');
                }
            });
        }
        this.filterResults();
    }
    changeSearchScope() {
        window.slimCodeEditor.modalManager.show({
            title: 'Search Scope',
            body: `
                <div class="space-y-3">
                    <div class="flex items-center space-x-2">
                        <input type="radio" id="scope-project" name="search-scope" value="project" ${this.searchScope === 'project' ? 'checked' : ''}>
                        <label for="scope-project">Current Project</label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="radio" id="scope-open-files" name="search-scope" value="open-files" ${this.searchScope === 'open-files' ? 'checked' : ''}>
                        <label for="scope-open-files">Open Files</label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="radio" id="scope-current-file" name="search-scope" value="current-file" ${this.searchScope === 'current-file' ? 'checked' : ''}>
                        <label for="scope-current-file">Current File</label>
                    </div>
                </div>
            `,
            onConfirm: () => {
                const selectedScope = document.querySelector('input[name="search-scope"]:checked').value;
                this.searchScope = selectedScope;
                if (this.scopePath) {
                    if (selectedScope === 'project') {
                        this.scopePath.textContent = 'Current Project';
                    } else if (selectedScope === 'open-files') {
                        this.scopePath.textContent = 'Open Files';
                    } else if (selectedScope === 'current-file') {
                        const currentFile = window.slimCodeEditor && window.slimCodeEditor.tabsManager ? 
                            window.slimCodeEditor.tabsManager.getActiveTab() : null;
                        this.scopePath.textContent = currentFile ? currentFile.name : 'Current File';
                    }
                }
            this.search();
            }
        });
    }
    debounceSearch() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.search();
        }, 300);
    }
    clearSearch() {
        if (this.input) {
            this.input.value = '';
        }
        this.clearResults();
        this.updateNavigationButtons();
        if (this.searchCount) {
            this.searchCount.textContent = '0 results';
        }
        if (this.placeholder) {
            this.placeholder.style.display = 'flex';
        }
    }
    navigateResults(direction) {
        if (this.currentResults.length === 0) return;
        if (direction === 'prev') {
            this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.currentResults.length - 1;
        } else {
            this.currentIndex = this.currentIndex < this.currentResults.length - 1 ? this.currentIndex + 1 : 0;
        }
        this.openResult(this.currentResults[this.currentIndex]);
        this.highlightCurrentResult();
    }
    highlightCurrentResult() {
        const resultItems = this.resultsContainer.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.classList.remove('bg-editor-highlight');
            item.classList.remove('active');
        });
        if (this.currentIndex >= 0 && this.currentResults.length > 0) {
            const currentResultItem = this.resultsContainer.querySelector(`.search-result-item[data-result-index="${this.currentIndex}"]`);
            if (currentResultItem) {
                currentResultItem.classList.add('active');
                currentResultItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                currentResultItem.classList.add('animate-pulse');
                setTimeout(() => {
                    currentResultItem.classList.remove('animate-pulse');
                }, 1000);
            }
        }
    }
    updateNavigationButtons() {
        if (this.prevButton && this.nextButton) {
            const hasResults = this.currentResults.length > 0;
            this.prevButton.disabled = !hasResults;
            this.nextButton.disabled = !hasResults;
        }
    }
    search() {
        const query = this.input ? this.input.value.trim() : '';
        if (!query) {
            this.clearResults();
            if (this.placeholder) {
                this.placeholder.style.display = 'flex';
            }
            return;
        }
        this.showLoading();
        const matchCase = this.caseToggle ? this.caseToggle.classList.contains('active') : false;
        const wholeWord = this.wordToggle ? this.wordToggle.classList.contains('active') : false;
        const useRegex = this.regexToggle ? this.regexToggle.classList.contains('active') : false;
        if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer) {
            this.showNoResults('No project open');
            return;
        }
        let searchTarget;
        if (this.searchScope === 'project') {
            searchTarget = window.slimCodeEditor.fileExplorer.currentProject;
            if (!searchTarget) {
                this.showNoResults('No project open');
                return;
            }
        } else if (this.searchScope === 'open-files') {
            if (!window.slimCodeEditor.tabsManager) {
                this.showNoResults('No open files');
                return;
            }
            searchTarget = {
                type: 'open-files',
                files: window.slimCodeEditor.tabsManager.getTabs()
            };
        } else if (this.searchScope === 'current-file') {
            if (!window.slimCodeEditor.tabsManager) {
                this.showNoResults('No active file');
                return;
            }
            const activeTab = window.slimCodeEditor.tabsManager.getActiveTab();
            if (!activeTab) {
                this.showNoResults('No active file');
                return;
            }
            searchTarget = {
                type: 'current-file',
                file: activeTab
            };
        }
        this.isSearching = true;
        setTimeout(() => {
            try {
                const results = this.searchInTarget(searchTarget, query, { matchCase, wholeWord, useRegex });
                this.currentResults = results;
                this.currentIndex = -1;
        this.displayResults(results);
                this.updateNavigationButtons();
                if (this.searchCount) {
                    this.searchCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
                }
            } catch (error) {
                this.showNoResults(`Search error: ${error.message}`);
            } finally {
                this.isSearching = false;
                this.hideLoading();
            }
        }, 10);
    }
    searchInTarget(target, query, options) {
        const results = [];
        let regex;
        try {
            if (options.useRegex) {
                regex = new RegExp(query, options.matchCase ? 'g' : 'gi');
            } else {
                let pattern = query;
                if (!options.useRegex) {
                    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }
                if (options.wholeWord) {
                    pattern = `\\b${pattern}\\b`;
                }
                regex = new RegExp(pattern, options.matchCase ? 'g' : 'gi');
            }
        } catch (error) {
            this.showNoResults(`Invalid regex: ${error.message}`);
            return results;
        }
        if (target.type === 'open-files') {
            target.files.forEach(file => {
                this.searchInFile(file, file.path || file.name, regex, results);
            });
        } else if (target.type === 'current-file') {
            this.searchInFile(target.file, target.file.path || target.file.name, regex, results);
        } else {
            this.searchInFolder(target.fileSystem, '', regex, results);
        }
        return results;
    }
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
    searchInFile(file, path, regex, results) {
        const filePath = path.includes(file.name) ? path : `${path}/${file.name}`;
        const content = file.content || '';
        regex.lastIndex = 0;
        const lines = content.split('\n');
        lines.forEach((line, lineIndex) => {
            regex.lastIndex = 0;
            let match;
            while ((match = regex.exec(line)) !== null) {
                results.push({
                    file: file,
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
    filterResults() {
        this.displayResults(this.currentResults);
    }
    displayResults(results) {
        this.clearResults();
        if (results.length === 0) {
            this.showNoResults();
            return;
        }
        if (this.placeholder) {
            this.placeholder.style.display = 'none';
        }
        const groupedResults = this.groupResultsByFile(results);
        Object.entries(groupedResults).forEach(([path, fileResults]) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'search-result-file mb-4';
            const headerElement = document.createElement('div');
            headerElement.className = 'search-result-file-header flex items-center';
            const iconElement = document.createElement('span');
            iconElement.className = 'material-icons text-sm';
            iconElement.textContent = 'description';
            headerElement.appendChild(iconElement);
            const nameElement = document.createElement('span');
            nameElement.className = 'search-result-file-name';
            const pathParts = path.split('/');
            nameElement.textContent = pathParts[pathParts.length - 1];
            headerElement.appendChild(nameElement);
            const pathElement = document.createElement('span');
            pathElement.className = 'search-result-file-path flex-1 truncate';
            pathElement.textContent = path.substring(0, path.lastIndexOf('/'));
            headerElement.appendChild(pathElement);
            const countElement = document.createElement('span');
            countElement.className = 'search-result-match-count text-xs text-editor-text-muted';
            countElement.textContent = `${fileResults.length} match${fileResults.length !== 1 ? 'es' : ''}`;
            headerElement.appendChild(countElement);
            fileElement.appendChild(headerElement);
            headerElement.addEventListener('click', () => {
                if (fileResults.length > 0) {
                    const result = fileResults[0];
                    result.path = path; 
                    this.openResult(result);
                }
            });
            fileResults.forEach((result) => {
                result.path = path;
                const globalIndex = this.currentResults.findIndex(r => 
                    r.path === result.path && 
                    r.line === result.line && 
                    r.column === result.column
                );
                const resultElement = document.createElement('div');
                resultElement.className = 'search-result-item flex';
                resultElement.dataset.resultIndex = globalIndex;
                resultElement.dataset.path = path;
                resultElement.dataset.line = result.line;
                resultElement.dataset.column = result.column;
                const lineElement = document.createElement('div');
                lineElement.className = 'search-result-line-number';
                lineElement.textContent = result.line;
                resultElement.appendChild(lineElement);
                const contentElement = document.createElement('div');
                contentElement.className = 'search-result-content flex-1';
                const beforeMatch = result.lineContent.substring(0, result.matchStart);
                const match = result.lineContent.substring(result.matchStart, result.matchEnd);
                const afterMatch = result.lineContent.substring(result.matchEnd);
                contentElement.innerHTML = `${this.escapeHtml(beforeMatch)}<span class="search-result-highlight">${this.escapeHtml(match)}</span>${this.escapeHtml(afterMatch)}`;
                resultElement.appendChild(contentElement);
                resultElement.addEventListener('click', () => {
                    this.currentIndex = globalIndex;
                    this.openResult(result);
                    this.highlightCurrentResult();
                });
                fileElement.appendChild(resultElement);
            });
            this.resultsContainer.appendChild(fileElement);
        });
    }
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
    openResult(result) {
        if (!window.slimCodeEditor) return;
        this.debugResult(result);
        const file = result.file || this.findFileByPath(result.path);
        if (!file) {
            console.error('File not found:', result.path);
            return;
        }
        if (window.slimCodeEditor.fileExplorer) {
        window.slimCodeEditor.fileExplorer.openFile(result.path);
        }
            setTimeout(() => {
            if (!window.slimCodeEditor.editor || !window.slimCodeEditor.editor.editor) {
                console.error('Editor not available');
                return;
            }
            try {
                const editor = window.slimCodeEditor.editor.editor;
                const position = {
                    lineNumber: result.line,
                    column: result.column
                };
                const range = {
                    startLineNumber: result.line,
                    startColumn: result.column,
                    endLineNumber: result.line,
                    endColumn: result.column + result.matchText.length
                };
                editor.revealRangeInCenter(range, monaco.editor.ScrollType.Smooth);
                editor.setSelection(range);
                editor.setPosition(position);
                editor.focus();
                const lineHighlightDecoration = editor.deltaDecorations([], [
                    {
                        range: new monaco.Range(result.line, 1, result.line, 1),
                        options: {
                            isWholeLine: true,
                            className: 'search-result-line-highlight',
                            glyphMarginClassName: 'search-result-glyph'
                        }
                    }
                ]);
                setTimeout(() => {
                    editor.deltaDecorations(lineHighlightDecoration, []);
                }, 2000);
                console.log('Navigated to search result:', result.path, result.line, result.column);
            } catch (error) {
                console.error('Error navigating to search result:', error);
                this.debugResult(result);
            }
        }, 500); 
    }
    findFileByPath(path) {
        if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer) {
            return null;
        }
        return window.slimCodeEditor.fileExplorer.findFileByPath(path);
    }
    showLoading() {
        if (this.placeholder) {
            this.placeholder.innerHTML = `
                <span class="material-icons text-3xl mb-2 opacity-50">hourglass_empty</span>
                <p>Searching...</p>
            `;
            this.placeholder.style.display = 'flex';
            this.placeholder.classList.add('search-loading');
        }
    }
    hideLoading() {
        if (this.placeholder) {
            this.placeholder.classList.remove('search-loading');
        }
    }
    showNoResults(message = 'No results found') {
        this.clearResults();
        if (this.placeholder) {
            this.placeholder.innerHTML = `
                <span class="material-icons text-3xl mb-2 opacity-50">search_off</span>
                <p>${message}</p>
            `;
            this.placeholder.style.display = 'flex';
        }
        if (this.searchCount) {
            this.searchCount.textContent = '0 results';
        }
    }
    clearResults() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '';
        }
    }
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    debugResult(result) {
        console.group('Search Result Debug');
        console.log('Result:', result);
        console.log('Path:', result.path);
        console.log('Line:', result.line);
        console.log('Column:', result.column);
        console.log('Match Text:', result.matchText);
        console.log('Line Content:', result.lineContent);
        const file = this.findFileByPath(result.path);
        console.log('File found:', !!file);
        console.log('Editor available:', !!window.slimCodeEditor && !!window.slimCodeEditor.editor);
        console.log('Editor instance:', !!window.slimCodeEditor && !!window.slimCodeEditor.editor && !!window.slimCodeEditor.editor.editor);
        console.groupEnd();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    window.slimCodeEditor = window.slimCodeEditor || {};
    window.slimCodeEditor.search = new Search();
});

