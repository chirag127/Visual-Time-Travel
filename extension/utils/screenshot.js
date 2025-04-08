/**
 * Screenshot utility module
 * Handles screenshot capture
 * @module utils/screenshot
 */

/**
 * Capture a screenshot of the current tab
 * @returns {Promise<string>} Base64 encoded screenshot
 */
export async function captureScreenshot() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.captureVisibleTab(
        null,
        { format: 'png', quality: 70 },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          // Remove the data:image/png;base64, prefix
          const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
          resolve(base64);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get the favicon URL of the current tab
 * @param {Object} tab - Chrome tab object
 * @returns {string|null} Favicon URL or null if not available
 */
export function getFaviconUrl(tab) {
  // Try to get favicon from tab
  if (tab.favIconUrl) {
    return tab.favIconUrl;
  }
  
  // Try to get favicon from Google's favicon service
  if (tab.url) {
    try {
      const url = new URL(tab.url);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch (error) {
      console.error('Error getting favicon URL:', error);
    }
  }
  
  return null;
}

/**
 * Get the current tab
 * @returns {Promise<Object>} Chrome tab object
 */
export function getCurrentTab() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (tabs.length === 0) {
          reject(new Error('No active tab found'));
          return;
        }
        
        resolve(tabs[0]);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if a URL should be captured
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL should be captured
 */
export function shouldCaptureUrl(url) {
  // Skip chrome:// URLs
  if (url.startsWith('chrome://')) {
    return false;
  }
  
  // Skip chrome-extension:// URLs
  if (url.startsWith('chrome-extension://')) {
    return false;
  }
  
  // Skip about: URLs
  if (url.startsWith('about:')) {
    return false;
  }
  
  // Skip file:// URLs
  if (url.startsWith('file://')) {
    return false;
  }
  
  // Skip data: URLs
  if (url.startsWith('data:')) {
    return false;
  }
  
  // Skip javascript: URLs
  if (url.startsWith('javascript:')) {
    return false;
  }
  
  // Skip empty URLs
  if (!url || url === '') {
    return false;
  }
  
  return true;
}
