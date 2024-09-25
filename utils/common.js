// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        document.documentElement.style.setProperty('--primary-color', '#FF8C61');
        document.documentElement.style.setProperty('--background-color', '#1E1E1E');
        document.documentElement.style.setProperty('--text-color', '#FFFFFF');
        document.documentElement.style.setProperty('--card-background', '#2D2D2D');
        document.documentElement.style.setProperty('--border-color', '#3D3D3D');
        document.querySelector('.theme-toggle').textContent = '☀️';
    } else {
        document.documentElement.style.setProperty('--primary-color', '#FF6B35');
        document.documentElement.style.setProperty('--background-color', '#F7F7F7');
        document.documentElement.style.setProperty('--text-color', '#333333');
        document.documentElement.style.setProperty('--card-background', '#FFFFFF');
        document.documentElement.style.setProperty('--border-color', '#E0E0E0');
        document.querySelector('.theme-toggle').textContent = '🌙';
    }
}

// Add more common functions here