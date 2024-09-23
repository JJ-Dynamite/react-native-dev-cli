// Sample data - replace with actual data loading logic
const sources = [
    "Memo from Mayor",
    "Mushroom Overgrowth",
    "Mushroom origin?",
    "Note on Risotto",
    "Proposal for Celebration",
    "Tommy's Essay"
];

// Make notes globally accessible
window.notes = [
    { type: "code", title: "JavaScript Functions", content: "function exampleFunction() {\n  console.log('Hello, world!');\n}" },
    { type: "csv", title: "Sales Data", content: "Date,Product,Quantity,Price\n2023-01-01,Widget A,100,9.99\n2023-01-02,Widget B,50,14.99" },
    { type: "docs", title: "Project Overview", content: "This project aims to revolutionize how we handle data processing in our organization." },
    { type: "code", title: "Python Class Example", content: "class ExampleClass:\n    def __init__(self, name):\n        self.name = name\n\n    def greet(self):\n        print(f'Hello, {self.name}!')" },
    { type: "csv", title: "Employee Records", content: "ID,Name,Department,Salary\n1,John Doe,IT,75000\n2,Jane Smith,HR,65000" },
];

// Sample data - replace with actual data loading logic
const notebooks = [
    { title: "JavaScript Basics", date: "Sep 22, 2024", sources: 0, type: "code" },
    { title: "Sales Data 2023", date: "Dec 6, 2023", sources: 8, type: "csv" },
    { title: "Project Documentation", date: "Dec 7, 2023", sources: 4, type: "docs" },
    { title: "Python Algorithms", date: "Nov 28, 2023", sources: 6, type: "code" },
    { title: "Marketing Campaign Results", date: "Nov 22, 2023", sources: 7, type: "csv" }
];

function renderSourcesAndNotes() {
    const sourcesList = document.getElementById('sources-list');
    sourcesList.innerHTML = ''; // Clear existing sources
    sources.forEach(source => {
        const div = document.createElement('div');
        div.className = 'source-item';
        div.innerHTML = `
            <input type="checkbox" id="${source.replace(/\s+/g, '-')}">
            <label for="${source.replace(/\s+/g, '-')}">${source}</label>
        `;
        sourcesList.appendChild(div);
    });

    const notesArea = document.getElementById('notes-area');
    if (!notesArea) {
        console.error('Notes area not found!');
        return;
    }
    notesArea.innerHTML = '';
    window.notes.forEach((note, index) => {
        const div = document.createElement('div');
        div.className = 'note-card';
        div.innerHTML = `
            <div class="note-card-header">
                <div class="note-type">${note.type.toUpperCase()}</div>
                <h3>${note.title}</h3>
            </div>
            <div class="note-card-content">
                <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
            </div>
        `;
        div.addEventListener('click', () => {
            console.log('Note clicked:', note.title);
            if (typeof window.openTextEditor === 'function') {
                console.log('Calling openTextEditor function');
                window.openTextEditor(note, index);
            } else {
                console.error('openTextEditor function not found!');
            }
        });
        notesArea.appendChild(div);
    });
}

function renderNotebooks() {
    const grid = document.getElementById('notebooks-grid');
    if (!grid) {
        console.error('Notebooks grid not found!');
        return;
    }
    grid.innerHTML = ''; // Clear existing notebooks
    
    // Add "New Notebook" card
    const newNotebookCard = document.createElement('div');
    newNotebookCard.className = 'notebook-card new-notebook';
    newNotebookCard.innerHTML = `
        <div class="new-notebook-icon">+</div>
        <div>New Notebook</div>
    `;
    newNotebookCard.addEventListener('click', createNewNotebook);
    grid.appendChild(newNotebookCard);

    // Add existing notebooks
    notebooks.forEach(notebook => {
        const card = document.createElement('div');
        card.className = 'notebook-card';
        card.innerHTML = `
            <div class="notebook-title">${notebook.title}</div>
            <div class="notebook-info">${notebook.date} • ${notebook.sources} sources</div>
        `;
        card.addEventListener('click', () => openNotebook(notebook));
        grid.appendChild(card);
    });
}

function createNewNotebook() {
    console.log('Creating new notebook');
    // Implement new notebook creation logic
}

function openNotebook(notebook) {
    console.log('Opening notebook:', notebook.title);
    // Hide home screen
    document.querySelector('.home-container').style.display = 'none';
    // Show editor container
    const editorContainer = document.querySelector('.editor-container');
    if (editorContainer) {
        editorContainer.style.display = 'flex';
    } else {
        console.error('Editor container not found!');
        return;
    }

    // Load notebook content
    loadNotebookContent(notebook);
}

function loadNotebookContent(notebook) {
    console.log('Loading content for notebook:', notebook.title);
    // This is where you'd load the actual content of the notebook
    renderSourcesAndNotes();
}

function showProjectsView() {
    document.querySelector('.home-container').style.display = 'block';
    document.querySelector('.editor-container').style.display = 'none';
    document.querySelector('.text-editor').style.display = 'none';
    renderNotebooks(); // Re-render notebooks when returning to Projects view
}

// Initialize notebook page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing notebook page');
    renderNotebooks();
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    } else {
        console.error('Theme toggle not found!');
    }
    
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const sourceCheckboxes = document.querySelectorAll('#sources-list input[type="checkbox"]');
            sourceCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    } else {
        console.error('Select all checkbox not found!');
    }

    // Add event listener for the home button to return to the notebook view
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
        homeButton.addEventListener('click', showProjectsView);
    } else {
        console.error('Home button not found!');
    }
});

// Add this at the end of the file
console.log('notebook.js loaded, openTextEditor function:', typeof window.openTextEditor);

// Expose necessary functions to the global scope
window.renderNotebooks = renderNotebooks;
window.showProjectsView = showProjectsView;
window.openNotebook = openNotebook;