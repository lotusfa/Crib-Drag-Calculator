// UI initialization and dark mode toggle

// Dark mode toggle - follows IPA project logic from ipa-core.js
export function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const iconImg = darkModeToggle.querySelector('.icon');
  const savedTheme = localStorage.getItem('theme');

  // Set initial state
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (iconImg) iconImg.src = './img/dark-mode.svg';
  } else {
    if (iconImg) iconImg.src = './img/light-mode.svg';
  }

  // Add click handler
  darkModeToggle.addEventListener('click', function() {
    darkModeToggle.classList.add('btn-theme-transition');
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    if (iconImg) {
      iconImg.src = isDark ? './img/dark-mode.svg' : './img/light-mode.svg';
    }

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
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
