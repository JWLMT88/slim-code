class GitHubManager {
    constructor() {
        // Elements
        this.container = document.querySelector('.github-container');
        this.authButton = document.querySelector('.github-auth-button');
        this.authStatus = document.querySelector('.github-auth-status');
        this.authIndicator = document.querySelector('.github-auth-indicator');
        this.authText = document.querySelector('.github-auth-text');
        this.userInfo = document.querySelector('.github-user-info');
        this.userAvatar = document.querySelector('.github-avatar img');
        this.userName = document.querySelector('.github-username');
        this.userBio = document.querySelector('.github-bio');
        this.statValues = document.querySelectorAll('.github-stat-value');
        this.repoUrlInput = document.querySelector('.github-repo-url');
        this.cloneButton = document.querySelector('.github-clone-button');
        this.cloneStatus = document.querySelector('.github-clone-status');
        this.cloneStage = document.querySelector('.github-clone-stage');
        this.clonePercent = document.querySelector('.github-clone-percent');
        this.cloneProgressBar = document.querySelector('.github-clone-progress-bar');
        this.recentList = document.querySelector('.github-recent-list');
        this.refreshButton = document.querySelector('.github-refresh-btn');
        this.settingsButton = document.querySelector('.github-settings-btn');
        // State
        this.isAuthenticated = false;
        this.authToken = localStorage.getItem('github-auth-token');
        this.userData = JSON.parse(localStorage.getItem('github-user-data') || 'null');
        this.recentRepos = JSON.parse(localStorage.getItem('github-recent-repos') || '[]');
        this.cloneStages = [
            'Initializing...',
            'Fetching repository metadata...',
            'Fetching repository contents...',
            'Processing files...',
            'Creating project structure...',
            'Finalizing...',
            'Complete!'
        ];
        this.init();
    }
    init() {
        if (!this.container) return;
        // Check if already authenticated
        if (this.authToken) {
            this.validateToken();
            // Display user data if available
            if (this.userData) {
                this.displayUserData(this.userData);
            }
        }
        // Add event listeners
        this.addEventListeners();
        // Load recent repositories
        this.loadRecentRepos();
    }
    addEventListeners() {
        // Auth button
        if (this.authButton) {
            this.authButton.addEventListener('click', () => {
                if (this.isAuthenticated) {
                    this.logout();
                } else {
                    this.authenticate();
                }
            });
        }
        // Clone button
        if (this.cloneButton) {
            this.cloneButton.addEventListener('click', () => {
                this.cloneRepository();
            });
        }
        // Example button
        const exampleButton = document.querySelector('.github-example-button');
        if (exampleButton) {
            exampleButton.addEventListener('click', () => {
                this.showExampleRepos();
            });
        }
        // Example links
        const exampleLinks = document.querySelectorAll('.github-example-link');
        if (exampleLinks.length > 0) {
            exampleLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.repoUrlInput) {
                        this.repoUrlInput.value = link.textContent.trim();
                        // Focus and scroll into view
                        this.repoUrlInput.focus();
                        this.repoUrlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            });
        }
        // Repo URL input (Enter key)
        if (this.repoUrlInput) {
            this.repoUrlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.cloneRepository();
                }
            });
        }
        // Refresh button
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => {
                this.refreshRepos();
            });
        }
        // Settings button
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }
    validateToken() {
        this.setAuthStatus('connecting', 'Validating GitHub token...');
        fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${this.authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Invalid token');
            }
        })
        .then(userData => {
            this.isAuthenticated = true;
            this.setAuthStatus('connected', `Connected as ${userData.login}`);
            this.updateAuthButton('Disconnect from GitHub');
            // Store user data
            this.userData = userData;
            localStorage.setItem('github-user-data', JSON.stringify(userData));
            // Display user data
            this.displayUserData(userData);
            // Fetch user repos
            this.fetchUserRepos();
        })
        .catch(error => {
            console.error('Error validating token:', error);
            this.isAuthenticated = false;
            this.setAuthStatus('disconnected', 'Not connected to GitHub');
            this.updateAuthButton('Connect to GitHub');
            // Clear user data
            this.userData = null;
            localStorage.removeItem('github-user-data');
            localStorage.removeItem('github-auth-token');
            this.authToken = null;
            // Hide user info
            if (this.userInfo) {
                this.userInfo.classList.add('hidden');
            }
        });
    }
    displayUserData(userData) {
        if (!this.userInfo || !userData) return;
        // Show user info section
        this.userInfo.classList.remove('hidden');
        // Set avatar
        if (this.userAvatar && userData.avatar_url) {
            this.userAvatar.src = userData.avatar_url;
        }
        // Set username
        if (this.userName) {
            this.userName.textContent = userData.login;
        }
        // Set bio
        if (this.userBio) {
            this.userBio.textContent = userData.bio || 'No bio available';
        }
        // Set stats
        if (this.statValues && this.statValues.length >= 3) {
            // Public repos
            this.statValues[0].textContent = userData.public_repos || 0;
            // Followers
            this.statValues[1].textContent = userData.followers || 0;
            // Following
            this.statValues[2].textContent = userData.following || 0;
        }
    }
    authenticate() {
        // Show modal with options for authentication
        if (window.slimCodeEditor && window.slimCodeEditor.modalManager) {
            window.slimCodeEditor.modalManager.show({
                title: 'GitHub Authentication',
                body: `
                    <div class="space-y-4">
                        <div class="mb-4">
                            <h4 class="text-sm font-medium mb-2">One-Click Authentication</h4>
                            <p class="text-xs text-editor-text-muted mb-3">Generate a token with the required scopes automatically.</p>
                            <div class="github-auth-steps space-y-3">
                                <div class="flex items-center">
                                    <div class="w-6 h-6 rounded-full bg-editor-highlight flex items-center justify-center mr-3">
                                        <span class="text-xs font-medium">1</span>
                                    </div>
                                    <button onclick="window.slimCodeEditor.githubManager.openGitHubTokenGenerator()" class="flex-1 py-2 px-3 bg-editor-accent text-black hover:bg-editor-accent/80 rounded-md transition-colors flex items-center justify-center">
                                        <span class="material-icons mr-2 text-sm">open_in_new</span>
                                        <span>Open GitHub Token Page</span>
                                    </button>
                                </div>
                                <div class="flex items-center opacity-70" id="github-auth-step2">
                                    <div class="w-6 h-6 rounded-full bg-editor-highlight flex items-center justify-center mr-3">
                                        <span class="text-xs font-medium">2</span>
                                    </div>
                                    <div class="flex-1 py-2 px-3 bg-editor-highlight/50 rounded-md flex items-center">
                                        <span class="material-icons mr-2 text-sm">content_copy</span>
                                        <span>Copy the generated token</span>
                                    </div>
                                </div>
                                <div class="flex items-center opacity-70" id="github-auth-step3">
                                    <div class="w-6 h-6 rounded-full bg-editor-highlight flex items-center justify-center mr-3">
                                        <span class="text-xs font-medium">3</span>
                                    </div>
                                    <div class="flex-1 relative">
                                        <input type="password" id="github-token" class="w-full bg-editor-bg border border-editor-border rounded p-2 pl-3 pr-8 text-sm focus:outline-none focus:border-editor-accent" placeholder="Paste token here">
                                        <button id="github-paste-button" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-editor-text-muted hover:text-editor-text transition-colors">
                                            <span class="material-icons text-sm">content_paste</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                onShow: () => {
                    setTimeout(() => {
                        const quickAuthBtn = document.getElementById('github-quick-auth');
                        if (quickAuthBtn) {
                            quickAuthBtn.addEventListener('click', () => {
                                this.openGitHubTokenGenerator();
                                // Activate step 2
                            });
                        }
                    }, 1000);
                    // Add event listener for paste button
                },
                onConfirm: () => {
                    const token = document.getElementById('github-token').value.trim();
                    if (token) {
                        this.authToken = token;
                        localStorage.setItem('github-auth-token', token);
                        this.validateToken();
                    }
                }
            });
        }
    }
    openGitHubTokenGenerator() {
        const step2 = document.getElementById('github-auth-step2');
        if (step2) {
            step2.classList.remove('opacity-70');
            step2.classList.add('animate__animated', 'animate__fadeIn');
        }
        // Activate step 3 after a delay
        setTimeout(() => {
            const step3 = document.getElementById('github-auth-step3');
            if (step3) {
                step3.classList.remove('opacity-70');
                step3.classList.add('animate__animated', 'animate__fadeIn');
                // Focus the token input
                const tokenInput = document.getElementById('github-token');
                if (tokenInput) {
                    tokenInput.focus();
                }
            }
        }, 1500);
        const pasteButton = document.getElementById('github-paste-button');
        if (pasteButton) {
            pasteButton.addEventListener('click', async () => {
                try {
                    const tokenInput = document.getElementById('github-token');
                    if (tokenInput) {
                        const text = await navigator.clipboard.readText();
                        tokenInput.value = text;
                        tokenInput.classList.add('border-editor-success');
                        setTimeout(() => {
                            tokenInput.classList.remove('border-editor-success');
                        }, 1000);
                    }
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                    if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
                        window.slimCodeEditor.notifications.show({
                            title: 'Clipboard Access',
                            message: 'Please paste the token manually. Clipboard access was denied.',
                            type: 'warning'
                        });
                    }
                }
            });
        }
        const tokenUrl = 'https://github.com/settings/tokens/new?description=SlimCode%20Editor%20Access&scopes=repo,read:user';
        const tokenWindow = window.open(tokenUrl, '_blank');
        window.slimCodeEditor.notifications.show({
            title: 'GitHub Token',
            message: 'Generate a token on GitHub and paste it back in the authentication dialog.',
            type: 'info',
            duration: 15000
        });
        setTimeout(() => {
            window.focus();
        }, 1000);
    }
    logout() {
        // Clear token
        this.authToken = null;
        localStorage.removeItem('github-auth-token');
        // Clear user data
        this.userData = null;
        localStorage.removeItem('github-user-data');
        // Update UI
        this.isAuthenticated = false;
        this.setAuthStatus('disconnected', 'Not connected to GitHub');
        this.updateAuthButton('Connect to GitHub');
        // Hide user info
        if (this.userInfo) {
            this.userInfo.classList.add('hidden');
        }
        // Show notification
        if (window.slimCodeEditor && window.slimCodeEditor.notifications) {
            window.slimCodeEditor.notifications.show({
                title: 'Logged Out',
                message: 'You have been disconnected from GitHub.',
                type: 'info'
            });
        }
    }
    setAuthStatus(status, message) {
        if (!this.authIndicator || !this.authText) return;
        // Remove all status classes
        this.authIndicator.classList.remove('connected', 'connecting', 'error');
        // Set appropriate class based on status
        switch (status) {
            case 'connected':
                this.authIndicator.classList.add('connected');
                break;
            case 'connecting':
                this.authIndicator.classList.add('connecting');
                break;
            case 'error':
            case 'disconnected':
                this.authIndicator.style.backgroundColor = 'var(--editor-error)';
                break;
        }
        // Set status message
        this.authText.textContent = message;
    }
    updateAuthButton(text) {
        if (!this.authButton) return;
        const buttonIcon = this.authButton.querySelector('.material-icons');
        const buttonText = this.authButton.querySelector('span:not(.material-icons)');
        if (buttonIcon) {
            buttonIcon.textContent = this.isAuthenticated ? 'logout' : 'login';
        }
        if (buttonText) {
            buttonText.textContent = text;
        }
        if (this.isAuthenticated) {
            this.authButton.classList.remove('bg-editor-highlight', 'hover:bg-editor-highlight/70');
            this.authButton.classList.add('border', 'border-slate-700', 'hover:bg-editor-error/70');
        } else {
            this.authButton.classList.remove('bg-editor-error', 'hover:bg-editor-error/70');
            this.authButton.classList.add('bg-editor-highlight', 'hover:bg-editor-highlight/70');
        }
    }
    fetchUserRepos() {
        if (!this.isAuthenticated || !this.authToken) return;
        fetch('https://api.github.com/user/repos?sort=updated', {
            headers: {
                'Authorization': `token ${this.authToken}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to fetch repositories');
                }
            })
            .then(repos => {
                this.displayRepos(repos);
            })
            .catch(error => {
                console.error('Error fetching repositories:', error);
                this.showError('Failed to fetch repositories. Please try again.');
            });
    }
    displayRepos(repos) {
        if (!this.recentList) return;
        this.recentList.innerHTML = '';
        if (repos.length === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'github-recent-empty text-sm text-editor-text-muted italic';
            emptyElement.textContent = 'No repositories found';
            this.recentList.appendChild(emptyElement);
            return;
        }
        repos.forEach(repo => {
            const repoElement = document.createElement('div');
            repoElement.className = 'github-repo-item';
            // Create repo icon based on language
            let languageIcon = 'code';
            let languageColor = '';
            if (repo.language) {
                switch(repo.language.toLowerCase()) {
                    case 'javascript':
                        languageIcon = 'javascript';
                        languageColor = '#f7df1e';
                        break;
                    case 'typescript':
                        languageIcon = 'code';
                        languageColor = '#3178c6';
                        break;
                    case 'python':
                        languageIcon = 'code';
                        languageColor = '#3572A5';
                        break;
                    case 'html':
                        languageIcon = 'html';
                        languageColor = '#e34c26';
                        break;
                    case 'css':
                        languageIcon = 'css';
                        languageColor = '#563d7c';
                        break;
                    default:
                        languageIcon = 'code';
                }
            }
            repoElement.innerHTML = `
                <span class="material-icons text-sm" ${languageColor ? `style="color: ${languageColor}"` : ''}>${languageIcon}</span>
                <span class="github-repo-name">${repo.name}</span>
                <span class="github-repo-owner">${repo.owner.login}</span>
            `;
            repoElement.addEventListener('click', () => {
                if (this.repoUrlInput) {
                    this.repoUrlInput.value = repo.clone_url;
                }
            });
            this.recentList.appendChild(repoElement);
        });
    }
    cloneRepository() {
        if (!this.repoUrlInput) return;
        const repoUrl = this.repoUrlInput.value.trim();
        if (!repoUrl) {
            this.showError('Please enter a repository URL or owner/repo');
            return;
        }
        this.showCloneProgress();
        this.updateCloneProgress(0, 0);
        let owner, repo;
        try {
            if (repoUrl.includes('github.com')) {
                const urlParts = repoUrl.replace(/\.git$/, '').split('/');
                owner = urlParts[urlParts.length - 2];
                repo = urlParts[urlParts.length - 1];
            } else if (repoUrl.includes('/')) {
                const parts = repoUrl.split('/');
                owner = parts[0];
                repo = parts[1];
            } else {
                throw new Error('Invalid repository format');
            }
            if (!owner || !repo) {
                throw new Error('Could not parse repository owner or name');
            }
            this.updateCloneProgress(10, 1);
            this.fetchRepoMetadata(owner, repo)
                .then(repoData => {
                    this.updateCloneProgress(30, 2);
                    return this.fetchRepoContents(owner, repo, repoData.default_branch)
                        .then(contents => {
                            this.updateCloneProgress(50, 3);
                            const repoInfo = {
                                name: repoData.name,
                                fullName: repoData.full_name,
                                owner: repoData.owner.login,
                                description: repoData.description,
                                url: repoData.html_url,
                                cloneUrl: repoData.clone_url,
                                defaultBranch: repoData.default_branch,
                                stars: repoData.stargazers_count,
                                forks: repoData.forks_count,
                                language: repoData.language
                            };
                            return this.processRepoContents(repoInfo, contents)
                                .then(() => {
                                    this.updateCloneProgress(90, 5);
                                    setTimeout(() => {
                                        this.updateCloneProgress(100, 6);
                                        this.addToRecentRepos(repoInfo);
                                        this.showSuccess(`Repository "${repoInfo.name}" cloned successfully`);
                                        this.repoUrlInput.value = '';
                                        this.openProject(repoInfo);
                                        setTimeout(() => {
                                            this.hideCloneProgress();
                                        }, 1000);
                                    }, 500);
                                });
                        });
                })
                .catch(error => {
                    console.error('Error cloning repository:', error);
                    this.hideCloneProgress();
                    this.showError(`Failed to clone repository: ${error.message}`);
                });
        } catch (error) {
            console.error('Error parsing repository URL:', error);
            this.hideCloneProgress();
            this.showError(`Invalid repository format: ${error.message}`);
        }
    }
    fetchRepoMetadata(owner, repo) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
        return fetch(apiUrl, { headers })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(response.status === 404 ? 'Repository not found' : 'Failed to fetch repository data');
                }
            });
    }
    fetchRepoContents(owner, repo, branch = 'main') {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const headers = this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {};
        return fetch(apiUrl, { headers })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to fetch repository contents');
                }
            });
    }
    processRepoContents(repoInfo, contents) {
        return new Promise((resolve, reject) => {
            try {
                if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer) {
                    reject(new Error('File explorer not available'));
                    return;
                }
                // Create project structure
                const projectStructure = {
                    name: repoInfo.name,
                    type: 'folder',
                    children: []
                };
                // Process tree items
                if (contents.tree && Array.isArray(contents.tree)) {
                    // First pass: create folders
                    const paths = {};
                    paths[''] = projectStructure; // Add root path
                    // Create all folders first
                    contents.tree.forEach(item => {
                        if (item.type === 'tree') {
                            const pathParts = item.path.split('/');
                            let currentPath = '';
                            let parentPath = '';
                            // Find or create each folder in the path
                            for (let i = 0; i < pathParts.length; i++) {
                                const part = pathParts[i];
                                parentPath = currentPath;
                                currentPath = currentPath ? `${currentPath}/${part}` : part;
                                // Skip if this path already exists
                                if (paths[currentPath]) continue;
                                // Get parent folder
                                const parentFolder = paths[parentPath];
                                if (!parentFolder) continue;
                                // Create new folder
                                const newFolder = {
                                    name: part,
                                    type: 'folder',
                                    children: []
                                };
                                // Add to parent
                                parentFolder.children.push(newFolder);
                                // Store in paths map
                                paths[currentPath] = newFolder;
                            }
                        }
                    });
                    // Second pass: add files to folders
                    const filesToFetch = [];
                    contents.tree.forEach(item => {
                        if (item.type === 'blob') {
                            const pathParts = item.path.split('/');
                            const fileName = pathParts.pop();
                            const parentPath = pathParts.join('/');
                            // Find parent folder
                            const parentFolder = paths[parentPath];
                            if (parentFolder) {
                                // Create file object
                                const file = {
                                    name: fileName,
                                    type: 'file',
                                    content: '',
                                    sha: item.sha,
                                    size: item.size
                                };
                                // Add to parent folder
                                parentFolder.children.push(file);
                                // Add to files to fetch if not too large
                                if (item.size < 100000) { // Skip files larger than 100KB
                                    filesToFetch.push({
                                        owner: repoInfo.owner,
                                        repo: repoInfo.name,
                                        sha: item.sha,
                                        path: item.path,
                                        file
                                    });
                                } else {
                                    // For large files, add placeholder content
                                    file.content = `// This file is too large to display (${Math.round(item.size / 1024)}KB)\n// View the original file at: ${repoInfo.url}/blob/${repoInfo.defaultBranch}/${item.path}`;
                                }
                            } else {
                                // If parent folder not found, create all necessary parent folders
                                let currentPath = '';
                                let currentFolder = projectStructure;
                                for (let i = 0; i < pathParts.length; i++) {
                                    const part = pathParts[i];
                                    const prevPath = currentPath;
                                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                                    // Check if folder already exists
                                    let folder = paths[currentPath];
                                    if (!folder) {
                                        // Create new folder
                                        folder = {
                                            name: part,
                                            type: 'folder',
                                            children: []
                                        };
                                        // Add to parent
                                        currentFolder.children.push(folder);
                                        // Store in paths map
                                        paths[currentPath] = folder;
                                    }
                                    currentFolder = folder;
                                }
                                // Now add the file to the folder
                                const file = {
                                    name: fileName,
                                    type: 'file',
                                    content: '',
                                    sha: item.sha,
                                    size: item.size
                                };
                                currentFolder.children.push(file);
                                // Add to files to fetch if not too large
                                if (item.size < 100000) {
                                    filesToFetch.push({
                                        owner: repoInfo.owner,
                                        repo: repoInfo.name,
                                        sha: item.sha,
                                        path: item.path,
                                        file
                                    });
                                } else {
                                    // For large files, add placeholder content
                                    file.content = `// This file is too large to display (${Math.round(item.size / 1024)}KB)\n// View the original file at: ${repoInfo.url}/blob/${repoInfo.defaultBranch}/${item.path}`;
                                }
                            }
                        }
                    });
                    // Log the project structure for debugging
                    console.log('Project structure:', JSON.parse(JSON.stringify(projectStructure)));
                    // Fetch file contents (up to 5 at a time)
                    const fetchBatch = (batch) => {
                        return Promise.all(batch.map(item => this.fetchFileContent(item.owner, item.repo, item.sha)
                            .then(content => {
                                item.file.content = content || '// Empty file';
                            })
                            .catch(error => {
                                console.error(`Error fetching file ${item.path}:`, error);
                                item.file.content = `// Error loading file content: ${error.message}`;
                            })
                        ));
                    };
                    // Process files in batches of 5
                    const processBatches = (files, batchSize = 5) => {
                        const batches = [];
                        for (let i = 0; i < files.length; i += batchSize) {
                            batches.push(files.slice(i, i + batchSize));
                        }
                        let completed = 0;
                        return batches.reduce((promise, batch) => {
                            return promise.then(() => {
                                return fetchBatch(batch).then(() => {
                                    completed += batch.length;
                                    this.updateCloneProgress(60 + Math.floor((completed / files.length) * 30));
                                });
                            });
                        }, Promise.resolve());
                    };
                    // Process files in batches
                    processBatches(filesToFetch)
                        .then(() => {
                            // Create project
                            window.slimCodeEditor.fileExplorer.createProject(projectStructure);
                            // Log success
                            console.log('Project created successfully:', repoInfo.name);
                            resolve();
                        })
                        .catch(error => {
                            console.error('Error processing files:', error);
                            reject(error);
                        });
                } else {
                    // Fallback if no tree is available
                    this.createFallbackProject(repoInfo);
                    resolve();
                }
            } catch (error) {
                console.error('Error processing repository contents:', error);
                reject(error);
            }
        });
    }
    fetchFileContent(owner, repo, sha) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`;
        const headers = this.authToken ? {
            'Authorization': `Bearer ${this.authToken}`,
            'Accept': 'application/vnd.github.v3.raw'
        } : {
            'Accept': 'application/vnd.github.v3.raw'
        };
        return fetch(apiUrl, { headers })
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else if (response.status === 404) {
                    throw new Error('File not found');
                } else if (response.status === 403) {
                    throw new Error('Rate limit exceeded or access denied');
                } else {
                    throw new Error(`Failed to fetch file content (${response.status})`);
                }
            })
            .then(content => {
                // Check if content is binary (contains null bytes or non-printable characters)
                if (this.isBinaryContent(content)) {
                    return `// Binary file - cannot display content\n// Size: ${content.length} bytes`;
                }
                return content;
            })
            .catch(error => {
                console.error('Error fetching file content:', error);
                return `// Error loading file: ${error.message}`;
            });
    }
    isBinaryContent(content) {
        // Check for null bytes (common in binary files)
        if (content.includes('\0')) {
            return true;
        }
        // Check for high concentration of non-printable characters
        let nonPrintable = 0;
        const sampleSize = Math.min(content.length, 1000); // Check first 1000 chars
        for (let i = 0; i < sampleSize; i++) {
            const code = content.charCodeAt(i);
            // Check for non-printable characters (except common whitespace)
            if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
                nonPrintable++;
            }
        }
        // If more than 10% are non-printable, consider it binary
        return (nonPrintable / sampleSize) > 0.1;
    }
    createFallbackProject(repoInfo) {
        if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer) {
            console.error('File explorer not available');
            return;
        }
        // Create a simple project structure
        const projectStructure = {
            name: repoInfo.name,
            type: 'folder',
            children: [
                {
                    name: 'src',
                    type: 'folder',
                    children: [
                        {
                            name: 'index.js',
                            type: 'file',
                            content: `// Main entry point for ${repoInfo.name}\n\nconsole.log('Hello from ${repoInfo.name}!');\n`
                        },
                        {
                            name: 'app.js',
                            type: 'file',
                            content: `// App module for ${repoInfo.name}\n\nclass App {\n  constructor() {\n    this.name = '${repoInfo.name}';\n  }\n\n  init() {\n    console.log(\`Initializing \${this.name}...\`);\n  }\n}\n\nmodule.exports = App;\n`
                        }
                    ]
                },
                {
                    name: 'README.md',
                    type: 'file',
                    content: `# ${repoInfo.name}\n\n${repoInfo.description || 'A GitHub repository'}\n\n## About\n\nThis repository was cloned from [${repoInfo.fullName}](${repoInfo.url}).\n\n> Note: Only a basic structure was created because the full repository contents could not be fetched.\n`
                },
                {
                    name: 'package.json',
                    type: 'file',
                    content: `{\n  "name": "${repoInfo.name.toLowerCase()}",\n  "version": "1.0.0",\n  "description": "${repoInfo.description || 'A GitHub repository'}",\n  "main": "src/index.js",\n  "scripts": {\n    "start": "node src/index.js",\n    "test": "echo \\"Error: no test specified\\" && exit 1"\n  },\n  "repository": {\n    "type": "git",\n    "url": "${repoInfo.cloneUrl}"\n  },\n  "author": "",\n  "license": "MIT"\n}\n`
                }
            ]
        };
        // Create project
        window.slimCodeEditor.fileExplorer.createProject(projectStructure);
    }
    openProject(repoInfo) {
        if (!window.slimCodeEditor || !window.slimCodeEditor.fileExplorer) {
            console.error('File explorer not available');
            return;
        }
        // Open README.md
        window.slimCodeEditor.fileExplorer.openFile(`${repoInfo.name}/README.md`);
    }
    showCloneProgress() {
        if (this.cloneStatus) {
            this.cloneStatus.classList.remove('hidden');
        }
    }
    updateCloneProgress(percent, stageIndex) {
        if (this.cloneProgressBar) {
            this.cloneProgressBar.style.width = `${percent}%`;
        }
        if (this.clonePercent) {
            this.clonePercent.textContent = `${Math.round(percent)}%`;
        }
        if (this.cloneStage && stageIndex >= 0 && stageIndex < this.cloneStages.length) {
            this.cloneStage.textContent = this.cloneStages[stageIndex];
        }
    }
    hideCloneProgress() {
        if (this.cloneStatus) {
            // Fade out animation
            this.cloneStatus.style.opacity = '0';
            setTimeout(() => {
                this.cloneStatus.classList.add('hidden');
                this.cloneStatus.style.opacity = '1';
            }, 300);
        }
    }
    showError(message) {
        this.removeMessages();
        const errorElement = document.createElement('div');
        errorElement.className = 'github-error';
        errorElement.textContent = message;
        // Add after clone button or progress
        const targetElement = document.querySelector('.github-clone-progress') || this.cloneButton;
        if (targetElement && targetElement.parentNode) {
            targetElement.parentNode.appendChild(errorElement);
        }
        // Remove after delay
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
    showSuccess(message) {
        this.removeMessages();
        const successElement = document.createElement('div');
        successElement.className = 'github-success';
        successElement.textContent = message;
        // Add after clone button or progress
        const targetElement = document.querySelector('.github-clone-progress') || this.cloneButton;
        if (targetElement && targetElement.parentNode) {
            targetElement.parentNode.appendChild(successElement);
        }
        // Remove after delay
        setTimeout(() => {
            successElement.remove();
        }, 5000);
    }
    removeMessages() {
        const errorElement = document.querySelector('.github-error');
        if (errorElement) {
            errorElement.remove();
        }
        const successElement = document.querySelector('.github-success');
        if (successElement) {
            successElement.remove();
        }
    }
    addToRecentRepos(repoInfo) {
        if (!repoInfo || !repoInfo.name || !repoInfo.owner) return;
        // Check if repo already exists in recent repos
        const existingIndex = this.recentRepos.findIndex(repo => 
            repo.name === repoInfo.name && repo.owner === repoInfo.owner
        );
        // If exists, remove it (will be added to the top)
        if (existingIndex !== -1) {
            this.recentRepos.splice(existingIndex, 1);
        }
        // Create repo object with essential info
        const repoObject = {
            name: repoInfo.name,
            owner: repoInfo.owner,
            fullName: repoInfo.fullName,
            url: repoInfo.url,
            cloneUrl: repoInfo.cloneUrl,
            description: repoInfo.description,
            language: repoInfo.language,
            stars: repoInfo.stars,
            forks: repoInfo.forks,
            timestamp: new Date().toISOString()
        };
        // Add to beginning of array
        this.recentRepos.unshift(repoObject);
        // Limit to 10 recent repos
        if (this.recentRepos.length > 10) {
            this.recentRepos = this.recentRepos.slice(0, 10);
        }
        // Save to localStorage
        localStorage.setItem('github-recent-repos', JSON.stringify(this.recentRepos));
        // Update UI
        this.loadRecentRepos();
    }
    loadRecentRepos() {
        if (!this.recentList) return;
        // Clear list
        this.recentList.innerHTML = '';
        if (this.recentRepos.length === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'github-recent-empty text-sm text-editor-text-muted italic';
            emptyElement.textContent = 'No recent repositories';
            this.recentList.appendChild(emptyElement);
            return;
        }
        // Add repos to list
        this.recentRepos.forEach(repo => {
            const repoElement = document.createElement('div');
            repoElement.className = 'github-repo-item';
            repoElement.innerHTML = `
                <span class="material-icons text-sm">code</span>
                <span class="github-repo-name">${repo.name}</span>
                <span class="github-repo-owner">${repo.owner}</span>
            `;
            // Add click event to clone repo
            repoElement.addEventListener('click', () => {
                if (this.repoUrlInput) {
                    this.repoUrlInput.value = repo.cloneUrl;
                }
            });
            this.recentList.appendChild(repoElement);
        });
    }
    clearRecentRepos() {
        this.recentRepos = [];
        localStorage.removeItem('github-recent-repos');
        this.loadRecentRepos();
    }
    refreshRepos() {
        if (this.isAuthenticated) {
            this.fetchUserRepos();
        } else {
            this.loadRecentRepos();
        }
    }
    showSettings() {
        if (window.slimCodeEditor && window.slimCodeEditor.modalManager) {
            window.slimCodeEditor.modalManager.show({
                title: 'GitHub Settings',
                body: `
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Recent Repositories</label>
                            <button id="github-clear-recent" class="py-1 px-2 bg-editor-error/20 hover:bg-editor-error/30 text-editor-error rounded text-xs">Clear Recent Repositories</button>
                        </div>
                        ${this.isAuthenticated ? `
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Authentication</label>
                            <button id="github-disconnect" class="py-1 px-2 bg-editor-error/20 hover:bg-editor-error/30 text-editor-error rounded text-xs">Disconnect from GitHub</button>
                        </div>
                        ` : ''}
                    </div>
                `,
                onShow: () => {
                    const clearRecentBtn = document.getElementById('github-clear-recent');
                    if (clearRecentBtn) {
                        clearRecentBtn.addEventListener('click', () => {
                            this.clearRecentRepos();
                            window.slimCodeEditor.modalManager.hideModal();
                        });
                    }
                    const disconnectBtn = document.getElementById('github-disconnect');
                    if (disconnectBtn) {
                        disconnectBtn.addEventListener('click', () => {
                            this.logout();
                            window.slimCodeEditor.modalManager.hideModal();
                        });
                    }
                }
            });
        }
    }
    showExampleRepos() {
        if (window.slimCodeEditor && window.slimCodeEditor.modalManager) {
            window.slimCodeEditor.modalManager.show({
                title: 'Example Repositories',
                body: `
                    <div class="space-y-4">
                        <p class="text-sm">Select an example repository to clone:</p>
                        <div class="space-y-2">
                            ${this.getExampleReposList().map(repo => `
                                <div class="github-example-repo-item p-3 bg-editor-highlight/30 hover:bg-editor-highlight/50 rounded-md cursor-pointer transition-colors" data-repo="${repo.repo}">
                                    <div class="flex items-center">
                                        <span class="material-icons mr-2 text-sm">code</span>
                                        <span class="font-medium">${repo.repo}</span>
                                    </div>
                                    <p class="text-xs text-editor-text-muted mt-1">${repo.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `,
                onShow: () => {
                    // Add event listeners for example repo items
                    const repoItems = document.querySelectorAll('.github-example-repo-item');
                    repoItems.forEach(item => {
                        item.addEventListener('click', () => {
                            const repo = item.getAttribute('data-repo');
                            if (this.repoUrlInput) {
                                this.repoUrlInput.value = repo;
                            }
                            window.slimCodeEditor.modalManager.hideModal();
                            // Clone after a short delay
                            setTimeout(() => {
                                this.cloneRepository();
                            }, 300);
                        });
                    });
                }
            });
        }
    }
    getExampleReposList() {
        return [
            {
                repo: 'microsoft/vscode-extension-samples',
                description: 'Sample extensions demonstrating the VS Code extension API'
            },
            {
                repo: 'facebook/react',
                description: 'A JavaScript library for building user interfaces'
            },
            {
                repo: 'twbs/bootstrap',
                description: 'The most popular HTML, CSS, and JavaScript framework'
            },
            {
                repo: 'vercel/next.js',
                description: 'The React Framework for Production'
            },
            {
                repo: 'nodejs/node',
                description: 'Node.js JavaScript runtime'
            },
            {
                repo: 'microsoft/TypeScript',
                description: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript'
            }
        ];
    }
    async openGist(gistId, fileName = '') {
        if (!this.isAuthenticated) {
            throw new Error('Authentication required to access Gists');
        }
        try {
            // Show loading notification
            window.slimCodeEditor.notifications.show('info', 'Loading Gist...');
            // Fetch the Gist data
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${this.authToken}`
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch Gist: ${response.statusText}`);
            }
            const gistData = await response.json();
            // Get the files from the Gist
            const files = gistData.files;
            if (!files || Object.keys(files).length === 0) {
                throw new Error('Gist contains no files');
            }
            // Create a temporary project folder for the Gist
            const gistFolder = `gist_${gistId}`;
            const projectManager = window.slimCodeEditor.fileExplorer.projectManager;
            // Create the project folder if it doesn't exist
            await projectManager.createFolder(gistFolder);
            // Process each file in the Gist
            const filePromises = [];
            let targetFile = null;
            for (const [key, fileData] of Object.entries(files)) {
                const filePath = `${gistFolder}/${fileData.filename}`;
                const content = fileData.content;
                // Create the file
                filePromises.push(projectManager.createFile(filePath, content));
                // If this is the target file or the first file (if no target specified)
                if ((fileName && fileData.filename === fileName) || 
                    (!fileName && !targetFile)) {
                    targetFile = filePath;
                }
            }
            // Wait for all files to be created
            await Promise.all(filePromises);
            // Open the target file
            if (targetFile) {
                window.slimCodeEditor.fileExplorer.openFile(targetFile);
            }
            // Add to recent repos with Gist info
            this.addToRecentRepos({
                name: `Gist: ${gistId}`,
                owner: gistData.owner ? gistData.owner.login : 'anonymous',
                description: gistData.description || 'GitHub Gist',
                url: gistData.html_url,
                language: targetFile ? this.getLanguageFromFilename(targetFile) : '',
                timestamp: new Date().toISOString()
            });
            // Show success notification
            window.slimCodeEditor.notifications.show('success', 'Gist loaded successfully');
            return targetFile;
        } catch (error) {
            console.error('Error opening Gist:', error);
            window.slimCodeEditor.notifications.show('error', `Failed to open Gist: ${error.message}`);
            throw error;
        }
    }
    getLanguageFromFilename(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'JavaScript',
            'ts': 'TypeScript',
            'jsx': 'React',
            'tsx': 'React TypeScript',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'less': 'Less',
            'json': 'JSON',
            'md': 'Markdown',
            'py': 'Python',
            'rb': 'Ruby',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'cs': 'C#',
            'go': 'Go',
            'php': 'PHP',
            'swift': 'Swift',
            'kt': 'Kotlin',
            'rs': 'Rust'
        };
        return languageMap[extension] || extension.toUpperCase();
    }
}
// Initialize GitHub manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.slimCodeEditor = window.slimCodeEditor || {};
    window.slimCodeEditor.githubManager = new GitHubManager();
}); 

