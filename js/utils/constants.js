const EDITOR_CONFIG = {
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
    minimap: {
        enabled: true,
        scale: 0.8,
        renderCharacters: false
    },
    automaticLayout: true,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    cursorStyle: 'line',
    quickSuggestions: true,
    folding: true,
    dragAndDrop: true,
    links: true,
    contextmenu: true,
    mouseWheelZoom: true,
    parameterHints: { enabled: true },
    suggest: {
        showIcons: true,
        showStatusBar: true,
        preview: true,
        previewMode: 'prefix'
    },
    snippets: { suggestions: true },
    wordBasedSuggestions: true,
    lineDecorationsWidth: 0,
    renderIndentGuides: true,
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    autoClosingBrackets: 'always',
    formatOnPaste: true,
    formatOnType: true
};

const FILE_ICONS = {
    js: 'javascript',
    ts: 'code',
    jsx: 'javascript',
    tsx: 'code',
    html: 'html',
    css: 'css',
    scss: 'css',
    json: 'data_object',
    md: 'description',
    txt: 'description',
    png: 'image',
    jpg: 'image',
    gif: 'gif',
    svg: 'image',
    pdf: 'picture_as_pdf'
};

const LANGUAGE_MAP = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    txt: 'plaintext'
};

const THEMES = {
    dark: 'vs-dark',
    light: 'vs-light',
    highContrast: 'hc-black'
};

const KEYBOARD_SHORTCUTS = {
    save: 'Ctrl+S',
    newFile: 'Ctrl+N',
    openFile: 'Ctrl+O',
    find: 'Ctrl+F',
    replace: 'Ctrl+H',
    commandPalette: 'Ctrl+P'
}; 