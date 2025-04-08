/**
 * Storage utility module
 * Handles browser storage operations
 * @module utils/storage
 */

/**
 * Get an item from storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value or null if not found
 */
export function getStorageItem(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

/**
 * Set an item in storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export function setStorageItem(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

/**
 * Remove an item from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export function removeStorageItem(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => {
      resolve();
    });
  });
}

/**
 * Clear all items from storage
 * @returns {Promise<void>}
 */
export function clearStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve();
    });
  });
}

/**
 * Get user preferences from storage
 * @returns {Promise<Object>} User preferences
 */
export async function getUserPreferences() {
  const preferences = await getStorageItem('preferences');
  
  // Return default preferences if not found
  return preferences || {
    captureEnabled: true,
    retentionDays: 30,
    showBreadcrumbs: true
  };
}

/**
 * Set user preferences in storage
 * @param {Object} preferences - User preferences
 * @returns {Promise<void>}
 */
export function setUserPreferences(preferences) {
  return setStorageItem('preferences', preferences);
}

/**
 * Get API URL from storage
 * @returns {Promise<string>} API URL
 */
export async function getApiUrl() {
  const apiUrl = await getStorageItem('api_url');
  
  // Return default API URL if not found
  return apiUrl || 'http://localhost:5000/api';
}

/**
 * Set API URL in storage
 * @param {string} apiUrl - API URL
 * @returns {Promise<void>}
 */
export function setApiUrl(apiUrl) {
  return setStorageItem('api_url', apiUrl);
}
