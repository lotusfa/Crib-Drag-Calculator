// UI initialization and dark mode toggle

// Dark mode toggle
export function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Check for saved dark mode preference
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = `<img src="./img/light-mode.svg" class="icon" alt="">`;
  }

  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
      darkModeToggle.innerHTML = `<img src="./img/light-mode.svg" class="icon" alt="">`;
      localStorage.setItem('darkMode', 'enabled');
    } else {
      darkModeToggle.innerHTML = `<img src="./img/dark-mode.svg" class="icon" alt="">`;
      localStorage.setItem('darkMode', 'disabled');
    }
  });
}

// Tutorial toggle
export function initTutorialToggle() {
  const toggleBtn = document.getElementById('toggle-tutorial');
  const tutorial = document.getElementById('tutorial');

  toggleBtn.addEventListener('click', () => {
    tutorial.classList.toggle('hidden');
  });
}

// Initialize all UI components
export function initUI() {
  initDarkModeToggle();
  initTutorialToggle();
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initUI);
