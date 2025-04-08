/**
 * Screenshot utility module
 * Handles capturing screenshots of tabs
 * @module utils/screenshot
 */

import api from './api.js';
import storage from './storage.js';

/**
 * Capture a screenshot of the current tab
 * @returns {Promise<string>} Base64 encoded screenshot
 */
const captureVisibleTab = async () => {
  try {
    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
    
    // Convert data URL to base64 string (remove the prefix)
    const base64 = dataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    return base64;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  }
};

/**
 * Get the favicon URL for a tab
 * @param {chrome.tabs.Tab} tab - Chrome tab
 * @returns {string|null} Favicon URL or null if not available
 */
const getFaviconUrl = (tab) => {
  if (tab.favIconUrl && tab.favIconUrl.startsWith('http')) {
    return tab.favIconUrl;
  }
  return null;
};

/**
 * Process a tab change and capture screenshot
 * @param {chrome.tabs.Tab} tab - The active tab
 * @returns {Promise<void>}
 */
const processTabChange = async (tab) => {
  try {
    // Check if capture is enabled in preferences
    const captureEnabled = await storage.preferences.isCaptureEnabled();
    if (!captureEnabled) {
      console.log('Screenshot capture is disabled');
      return;
    }
    
    // Check if user is authenticated
    const isAuthenticated = await api.isAuthenticated();
    if (!isAuthenticated) {
      console.log('User is not authenticated');
      return;
    }
    
    // Skip chrome:// and edge:// URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      console.log('Skipping browser internal page:', tab.url);
      return;
    }
    
    // Capture screenshot
    console.log('Capturing screenshot for:', tab.url);
    const imageBase64 = await captureVisibleTab();
    
    // Get favicon URL
    const favicon = getFaviconUrl(tab);
    
    // Upload to server
    await api.history.uploadScreenshot(
      imageBase64,
      tab.url,
      tab.title || 'Untitled Page',
      favicon
    );
    
    console.log('Screenshot uploaded successfully');
  } catch (error) {
    console.error('Error processing tab change:', error);
  }
};

export default {
  captureVisibleTab,
  getFaviconUrl,
  processTabChange
};
