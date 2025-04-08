/**
 * Settings component module
 * Handles settings UI
 * @module components/settings
 */

import { updatePreferences } from '../utils/api.js';
import { getUserPreferences, setUserPreferences } from '../utils/storage.js';
import { clearAuth } from '../utils/auth.js';

/**
 * Initialize settings component
 * @param {Function} onLogout - Callback function to call on logout
 * @param {Function} onSettingsChanged - Callback function to call when settings change
 */
export async function initSettingsComponent(onLogout, onSettingsChanged) {
  // Get form elements
  const settingsForm = document.getElementById('settings-form');
  const captureEnabledCheckbox = document.getElementById('capture-enabled');
  const retentionDaysInput = document.getElementById('retention-days');
  const showBreadcrumbsCheckbox = document.getElementById('show-breadcrumbs');
  const logoutButton = document.getElementById('logout-button');
  const settingsError = document.getElementById('settings-error');
  const settingsSuccess = document.getElementById('settings-success');
  
  // Load user preferences
  const preferences = await getUserPreferences();
  
  // Set form values
  captureEnabledCheckbox.checked = preferences.captureEnabled;
  retentionDaysInput.value = preferences.retentionDays;
  showBreadcrumbsCheckbox.checked = preferences.showBreadcrumbs;
  
  // Add event listeners
  settingsForm.addEventListener('submit', handleSettingsSubmit);
  logoutButton.addEventListener('click', handleLogout);
  
  /**
   * Handle settings form submission
   * @param {Event} event - Form submission event
   */
  async function handleSettingsSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const captureEnabled = captureEnabledCheckbox.checked;
    const retentionDays = parseInt(retentionDaysInput.value);
    const showBreadcrumbs = showBreadcrumbsCheckbox.checked;
    
    // Validate retention days
    if (isNaN(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      settingsError.textContent = 'Retention days must be between 1 and 365';
      settingsSuccess.textContent = '';
      return;
    }
    
    // Clear previous messages
    settingsError.textContent = '';
    settingsSuccess.textContent = '';
    
    try {
      // Disable form
      setFormDisabled(true);
      
      // Create preferences object
      const preferences = {
        captureEnabled,
        retentionDays,
        showBreadcrumbs
      };
      
      // Update preferences in storage
      await setUserPreferences(preferences);
      
      // Update preferences on server
      await updatePreferences(preferences);
      
      // Show success message
      settingsSuccess.textContent = 'Settings saved successfully';
      
      // Call settings changed callback
      if (onSettingsChanged) {
        onSettingsChanged(preferences);
      }
    } catch (error) {
      // Show error
      settingsError.textContent = error.message || 'Failed to save settings';
    } finally {
      // Enable form
      setFormDisabled(false);
    }
  }
  
  /**
   * Handle logout button click
   */
  async function handleLogout() {
    try {
      // Clear auth data
      await clearAuth();
      
      // Call logout callback
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  
  /**
   * Set form disabled state
   * @param {boolean} disabled - Whether to disable the form
   */
  function setFormDisabled(disabled) {
    // Get all form elements
    const elements = settingsForm.elements;
    
    // Set disabled state for each element
    for (let i = 0; i < elements.length; i++) {
      elements[i].disabled = disabled;
    }
    
    // Also disable logout button
    logoutButton.disabled = disabled;
  }
}
