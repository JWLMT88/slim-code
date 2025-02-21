function createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'javascript',
        tsx: 'javascript',
        html: 'html',
        css: 'css',
        scss: 'css',
        json: 'data_object',
        md: 'article',
        txt: 'description',
        png: 'image',
        jpg: 'image',
        jpeg: 'image',
        gif: 'gif',
        svg: 'image',
        pdf: 'picture_as_pdf',
        zip: 'folder_zip',
        default: 'description'
    };
    return icons[ext] || icons.default;
} 