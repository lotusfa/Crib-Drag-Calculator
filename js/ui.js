// UI initialization and dark mode toggle

// Dark mode toggle
export function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');

  // Check for saved dark mode preference
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    // In dark mode, show light-mode icon (sun)
    darkModeToggle.innerHTML = `<img src="./img/light-mode.svg" class="icon" alt="">`;
  }

  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    if (isDark) {
      // Dark mode active - show light-mode icon (sun)
      darkModeToggle.innerHTML = `<img src="./img/light-mode.svg" class="icon" alt="">`;
      localStorage.setItem('darkMode', 'enabled');
    } else {
      // Light mode active - show dark-mode icon (moon)
      darkModeToggle.innerHTML = `<img src="./img/dark-mode.svg" class="icon" alt="">`;
      localStorage.setItem('darkMode', 'disabled');
    }
  });
}

// Tutorial toggle with expandable section
export function initTutorialToggle() {
  const toggleBtn = document.getElementById('toggle-tutorial');
  const tutorialSection = document.getElementById('tutorial-section');

  toggleBtn.addEventListener('click', () => {
    const tutorial = document.getElementById('tutorial');
    const icon = toggleBtn.querySelector('.expandable-icon');

    tutorial.classList.toggle('hidden');

    const isExpanded = !tutorial.classList.contains('hidden');
    toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    icon.textContent = isExpanded ? '−' : '+';
  });
}

// Character set type selector
export function initCharSetType() {
  const charSetType = document.getElementById('char_set_type');
  const charSet = document.getElementById('char_set');

  const presets = {
    'common': "a-zA-Z0-9.,?! :;'",
    'alphanumeric': 'a-zA-Z0-9',
    'letters': 'a-zA-Z',
    'custom': ''
  };

  if (charSetType && charSet) {
    charSetType.addEventListener('change', (e) => {
      charSet.value = presets[e.target.value] || '';
      charSet.focus();
    });
  }
}

// Initialize all UI components
export function initUI() {
  initDarkModeToggle();
  initTutorialToggle();
  initCharSetType();
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initUI);
