// Sample data for notebooks
const notebooks = [
    { title: "Untitled notebook", date: "Sep 22, 2024", sources: 0 },
    { title: "Introduction to NotebookLM", date: "Dec 6, 2023", sources: 8 },
    // Add more notebook data
];

function renderNotebooks() {
    const grid = document.getElementById('notebooks-grid');
    
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
    // Implement notebook opening logic
    window.location.href = `notebook.html?id=${notebook.id}`;
}

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
    renderNotebooks();
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
});