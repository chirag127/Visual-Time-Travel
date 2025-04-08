/**
 * Popup script
 * Handles popup UI and interactions
 */

import { isLoggedIn, clearAuth } from './utils/auth.js';
import { initLoginComponent } from './components/login.js';
import { initSettingsComponent } from './components/settings.js';
import { initTimelineComponent } from './components/timeline.js';

// DOM elements
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const timelineTab = document.getElementById('timeline-tab');
const settingsTab = document.getElementById('settings-tab');
const timelinePanel = document.getElementById('timeline-panel');
const settingsPanel = document.getElementById('settings-panel');
const captureButton = document.getElementById('capture-button');
const captureStatus = document.getElementById('capture-status');
const themeToggle = document.getElementById('theme-toggle-checkbox');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  const loggedIn = await isLoggedIn();
  
  // Show appropriate container
  if (loggedIn) {
    showMainContainer();
  } else {
    showAuthContainer();
  }
  
  // Initialize theme
  initTheme();
  
  // Add event listeners
  timelineTab.addEventListener('click', showTimelinePanel);
  settingsTab.addEventListener('click', showSettingsPanel);
  captureButton.addEventListener('click', captureCurrentTab);
  themeToggle.addEventListener('change', toggleTheme);
});

/**
 * Show auth container
 */
function showAuthContainer() {
  authContainer.style.display = 'block';
  mainContainer.style.display = 'none';
  
  // Initialize login component
  initLoginComponent(handleLoginSuccess);
}

/**
 * Show main container
 */
function showMainContainer() {
  authContainer.style.display = 'none';
  mainContainer.style.display = 'block';
  
  // Initialize components
  initTimelineComponent();
  initSettingsComponent(handleLogout, handleSettingsChanged);
}

/**
 * Show timeline panel
 */
function showTimelinePanel() {
  timelinePanel.classList.add('active');
  settingsPanel.classList.remove('active');
  timelineTab.classList.add('active');
  settingsTab.classList.remove('active');
}

/**
 * Show settings panel
 */
function showSettingsPanel() {
  settingsPanel.classList.add('active');
  timelinePanel.classList.remove('active');
  settingsTab.classList.add('active');
  timelineTab.classList.remove('active');
}

/**
 * Handle login success
 */
function handleLoginSuccess() {
  showMainContainer();
}

/**
 * Handle logout
 */
function handleLogout() {
  showAuthContainer();
}

/**
 * Handle settings changed
 * @param {Object} preferences - User preferences
 */
function handleSettingsChanged(preferences) {
  console.log('Settings changed:', preferences);
}

/**
 * Capture current tab
 */
async function captureCurrentTab() {
  try {
    // Show loading
    captureButton.disabled = true;
    captureStatus.textContent = 'Capturing...';
    captureStatus.style.color = '';
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'captureCurrentTab'
    });
    
    if (response.success) {
      // Show success
      captureStatus.textContent = 'Screenshot captured successfully!';
      captureStatus.style.color = 'var(--success-color)';
      
      // Refresh timeline
      await initTimelineComponent();
    } else {
      // Show error
      captureStatus.textContent = response.error || 'Failed to capture screenshot';
      captureStatus.style.color = 'var(--danger-color)';
    }
  } catch (error) {
    // Show error
    captureStatus.textContent = error.message || 'Failed to capture screenshot';
    captureStatus.style.color = 'var(--danger-color)';
  } finally {
    // Enable button
    captureButton.disabled = false;
    
    // Clear status after a delay
    setTimeout(() => {
      captureStatus.textContent = '';
    }, 3000);
  }
}

/**
 * Initialize theme
 */
function initTheme() {
  // Check if dark theme is enabled
  const darkThemeEnabled = localStorage.getItem('darkTheme') === 'true';
  
  // Set theme
  if (darkThemeEnabled) {
    document.body.classList.add('dark-theme');
    themeToggle.checked = true;
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  // Toggle dark theme class
  document.body.classList.toggle('dark-theme');
  
  // Save preference
  const darkThemeEnabled = document.body.classList.contains('dark-theme');
  localStorage.setItem('darkTheme', darkThemeEnabled);
}
