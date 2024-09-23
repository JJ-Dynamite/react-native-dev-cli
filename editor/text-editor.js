function openTextEditor(note, index) {
    console.log('openTextEditor called for note:', note.title);
    
    const editorContainer = document.querySelector('.text-editor');
    const notesArea = document.getElementById('notes-area');
    
    if (!editorContainer || !notesArea) {
        console.error('Required elements not found!');
        return;
    }
    
    // Hide notes area and show editor
    notesArea.style.display = 'none';
    editorContainer.style.display = 'flex';

    // Set up the editor with the note content
    const titleElement = document.getElementById('text-editor-title');
    const contentElement = document.getElementById('text-editor-content');
    const fileNameElement = document.getElementById('file-name');

    if (!titleElement || !contentElement || !fileNameElement) {
        console.error('Editor elements not found!');
        return;
    }

    titleElement.textContent = note.title;
    fileNameElement.textContent = note.title;
    contentElement.innerHTML = ''; // Clear existing content

    // Set up the editor based on note type
    setupEditorForNoteType(note);

    // Add close button functionality
    const closeBtn = document.querySelector('.text-editor-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            editorContainer.style.display = 'none';
            notesArea.style.display = 'grid'; // or whatever the original display value was
            // Save the content back to the note
            window.notes[index].content = contentElement.textContent;
        };
    }

    console.log('Editor opened successfully');
}

function setupEditorForNoteType(note) {
    const viewSelector = document.getElementById('view-selector-btn');
    const codeToolbar = document.getElementById('code-toolbar');
    const defaultToolbar = document.getElementById('default-toolbar');
    const viewOptions = document.getElementById('view-options');

    switch (note.type) {
        case 'code':
            viewSelector.textContent = 'Code';
            codeToolbar.style.display = 'flex';
            defaultToolbar.style.display = 'none';
            setupCodeView(note);
            updateViewOptions(['Code', 'Preview'], note);
            break;
        case 'csv':
            viewSelector.textContent = 'Table';
            codeToolbar.style.display = 'none';
            defaultToolbar.style.display = 'flex';
            setupCSVView(note);
            updateViewOptions(['Table', 'Timeline', 'Board', 'Calendar', 'Gallery'], note);
            break;
        case 'docs':
        default:
            viewSelector.textContent = 'List';
            codeToolbar.style.display = 'none';
            defaultToolbar.style.display = 'flex';
            setupDefaultView(note);
            updateViewOptions(['List', 'Empty view'], note);
            break;
    }

    // Add event listener for view selector
    viewSelector.onclick = () => {
        viewOptions.style.display = viewOptions.style.display === 'none' ? 'block' : 'none';
    };
}

function updateViewOptions(options, note) {
    const viewOptions = document.getElementById('view-options');
    viewOptions.innerHTML = '';
    options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'view-option';
        div.textContent = option;
        div.onclick = () => changeView(option.toLowerCase(), note);
        viewOptions.appendChild(div);
    });
}

function changeView(viewType, note) {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = ''; // Clear existing content

    switch (viewType) {
        case 'table':
            setupTableView(note);
            break;
        case 'timeline':
            setupTimelineView(note);
            break;
        case 'board':
            setupBoardView(note);
            break;
        case 'calendar':
            setupCalendarView(note);
            break;
        case 'gallery':
            setupGalleryView(note);
            break;
        case 'preview':
            setupPreviewView(note);
            break;
        default:
            console.error('Unknown view type:', viewType);
    }

    document.getElementById('view-selector-btn').textContent = viewType.charAt(0).toUpperCase() + viewType.slice(1);
    document.getElementById('view-options').style.display = 'none';
}

function setupCodeView(note) {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = `
        <div class="code-editor-layout">
            <div class="top-tabs">
                <button class="tab-button active" data-tab="explorer"><i class="icon-files"></i></button>
                <button class="tab-button" data-tab="search"><i class="icon-search"></i></button>
                <button class="tab-button" data-tab="source-control"><i class="icon-git-branch"></i></button>
                <button class="tab-button" data-tab="run"><i class="icon-play"></i></button>
                <button class="tab-button" data-tab="extensions"><i class="icon-package"></i></button>
                <button class="tab-button" data-tab="more"><i class="icon-more"></i></button>
            </div>
            <div class="sidebar">
                <div id="explorer-content" class="tab-content active">
                    <!-- File explorer content will be added here -->
                </div>
                <div id="search-content" class="tab-content">
                    <!-- Search content -->
                </div>
                <div id="source-control-content" class="tab-content">
                    <!-- Source control content -->
                </div>
                <div id="run-content" class="tab-content">
                    <!-- Run content -->
                </div>
                <div id="extensions-content" class="tab-content">
                    <!-- Extensions content -->
                </div>
                <div id="more-content" class="tab-content">
                    <!-- More options content -->
                </div>
            </div>
            <div class="code-editor-main">
                <div class="editor-tabs">
                    <button class="editor-tab active">${note.title}</button>
                    <button class="editor-tab">+</button>
                </div>
                <div class="code-editor-container">
                    <textarea id="code-editor"></textarea>
                </div>
            </div>
        </div>
    `;

    const codeEditor = document.getElementById('code-editor');
    codeEditor.value = note.content;

    // Initialize CodeMirror
    const cmEditor = CodeMirror.fromTextArea(codeEditor, {
        lineNumbers: true,
        mode: 'javascript',
        theme: 'monokai'
    });
    cmEditor.setSize('100%', '100%');

    // Add event listeners to top tabs
    const topTabs = document.querySelectorAll('.top-tabs .tab-button');
    topTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            topTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabContents = document.querySelectorAll('.sidebar .tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tab.dataset.tab}-content`).classList.add('active');
        });
    });

    // Populate file explorer
    populateFileExplorer();
}

function populateFileExplorer() {
    const explorerContent = document.getElementById('explorer-content');
    const files = [
        { name: 'notebook.js', type: 'js' },
        { name: 'editor.html', type: 'html' },
        { name: 'notebook.html', type: 'html' },
        { name: 'text-editor.js', type: 'js' },
        { name: 'styles.css', type: 'css' },
        { name: 'index.html', type: 'html' },
        { name: 'common.js', type: 'js' },
        { name: 'electron-start.js', type: 'js' },
        { name: 'electron-launcher.js', type: 'js' },
        { name: 'editor.css', type: 'css' },
        { name: 'editor.js', type: 'js' },
    ];

    const fileList = document.createElement('ul');
    fileList.className = 'file-list';
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <span class="file-icon">${getFileIcon(file.type)}</span>
            <span class="file-name">${file.name}</span>
        `;
        fileList.appendChild(li);
    });
    explorerContent.appendChild(fileList);
}

function getFileIcon(fileType) {
    switch (fileType) {
        case 'js': return '<span style="color: #F0DB4F;">JS</span>';
        case 'html': return '<span style="color: #E34C26;">&lt;&gt;</span>';
        case 'css': return '<span style="color: #264DE4;">#</span>';
        default: return '📄';
    }
}

function setupCSVView(note) {
    setupTableView(note);
    updateViewOptions(['Table', 'Timeline', 'Board', 'Calendar', 'Gallery'], note);
}

function setupDefaultView(note) {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = `<div class="block-content" contenteditable="true">${note.content}</div>`;
}

function setupTableView(note) {
    const contentElement = document.getElementById('text-editor-content');
    const rows = note.content.split('\n').map(row => row.split(','));
    const table = document.createElement('table');
    table.className = 'csv-table';

    rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, cellIndex) => {
            const cellElement = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
            cellElement.textContent = cell.trim();
            tr.appendChild(cellElement);
        });
        table.appendChild(tr);
    });

    contentElement.appendChild(table);
}

function setupBoardView() {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = `
        <div class="board-view">
            <div class="board-column">
                <h3>To Do</h3>
                <div class="board-item">Task 1</div>
                <div class="board-item">Task 2</div>
            </div>
            <div class="board-column">
                <h3>In Progress</h3>
                <div class="board-item">Task 3</div>
            </div>
            <div class="board-column">
                <h3>Done</h3>
                <div class="board-item">Task 4</div>
            </div>
        </div>
    `;
}

function setupTimelineView(note) {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = '<div class="mermaid"></div>';
    const mermaidDiv = contentElement.querySelector('.mermaid');

    // Parse CSV data
    const rows = note.content.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const data = rows.slice(1);

    // Assume the first column is the date/time and the second is the event
    let mermaidCode = '%%{init: { \'logLevel\': \'debug\', \'theme\': \'dark\' } }%%\n    timeline\n';
    mermaidCode += `        title ${note.title}\n`;
    data.forEach(row => {
        const year = row[0];
        const events = row.slice(1).filter(event => event.trim() !== '').join(' : ');
        mermaidCode += `        ${year} : ${events}\n`;
    });

    mermaidDiv.textContent = mermaidCode;

    // Render the Mermaid diagram
    mermaid.init(undefined, mermaidDiv);
}

function setupCalendarView() {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = `
        <div class="calendar-view">
            <div class="calendar-header">
                <button>&lt;</button>
                <h3>March 2023</h3>
                <button>&gt;</button>
            </div>
            <div class="calendar-grid">
                <!-- Add calendar days here -->
                <div class="calendar-day">1</div>
                <div class="calendar-day">2</div>
                <!-- ... more days ... -->
            </div>
        </div>
    `;
}

function setupGalleryView() {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = `
        <div class="gallery-view">
            <div class="gallery-item">
                <img src="placeholder-image-1.jpg" alt="Item 1">
                <div class="gallery-caption">Item 1</div>
            </div>
            <div class="gallery-item">
                <img src="placeholder-image-2.jpg" alt="Item 2">
                <div class="gallery-caption">Item 2</div>
            </div>
            <div class="gallery-item">
                <img src="placeholder-image-3.jpg" alt="Item 3">
                <div class="gallery-caption">Item 3</div>
            </div>
        </div>
    `;
}

function setupPreviewView(note) {
    const contentElement = document.getElementById('text-editor-content');
    contentElement.innerHTML = `
        <div class="preview-view">
            <iframe srcdoc="${note.content}"></iframe>
        </div>
    `;
}

// Make sure to export the openTextEditor function
window.openTextEditor = openTextEditor;