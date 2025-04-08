/**
 * Storage utility module
 * Handles browser storage operations
 * @module utils/storage
 */

/**
 * Get a value from storage
 * @param {string} key - Storage key
 * @param {*} [defaultValue=null] - Default value if key doesn't exist
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<*>} The stored value or default value
 */
const get = async (key, defaultValue = null, storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  const result = await storage.get(key);
  return result[key] !== undefined ? result[key] : defaultValue;
};

/**
 * Set a value in storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<void>}
 */
const set = async (key, value, storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  await storage.set({ [key]: value });
};

/**
 * Remove a value from storage
 * @param {string} key - Storage key
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<void>}
 */
const remove = async (key, storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  await storage.remove(key);
};

/**
 * Clear all values from storage
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<void>}
 */
const clear = async (storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  await storage.clear();
};

/**
 * Get all values from storage
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<Object>} All stored values
 */
const getAll = async (storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  return await storage.get(null);
};

/**
 * Check if a key exists in storage
 * @param {string} key - Storage key
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<boolean>} Whether the key exists
 */
const has = async (key, storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  const result = await storage.get(key);
  return result[key] !== undefined;
};

/**
 * Get the size of storage in bytes
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {Promise<number>} Storage size in bytes
 */
const getSize = async (storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  const data = await storage.get(null);
  const json = JSON.stringify(data);
  return new Blob([json]).size;
};

/**
 * Listen for changes to storage
 * @param {Function} callback - Callback function
 * @param {string} [storageArea='local'] - Storage area ('local' or 'sync')
 * @returns {void}
 */
const onChange = (callback, storageArea = 'local') => {
  const storage = storageArea === 'sync' ? chrome.storage.sync : chrome.storage.local;
  storage.onChanged.addListener((changes, area) => {
    if (area === storageArea) {
      callback(changes);
    }
  });
};

// User preferences storage
const preferences = {
  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  get: async () => {
    return await get('preferences', {
      captureEnabled: true,
      retentionDays: 30,
      showBreadcrumbs: true,
      darkMode: false,
      apiBaseUrl: 'http://localhost:5000/api'
    });
  },

  /**
   * Set user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  set: async (preferences) => {
    const currentPrefs = await get('preferences', {});
    await set('preferences', { ...currentPrefs, ...preferences });
  },

  /**
   * Check if screenshot capture is enabled
   * @returns {Promise<boolean>} Whether screenshot capture is enabled
   */
  isCaptureEnabled: async () => {
    const preferences = await get('preferences', { captureEnabled: true });
    return preferences.captureEnabled;
  },

  /**
   * Set screenshot capture enabled/disabled
   * @param {boolean} enabled - Whether to enable screenshot capture
   * @returns {Promise<void>}
   */
  setCaptureEnabled: async (enabled) => {
    const preferences = await get('preferences', {});
    await set('preferences', { ...preferences, captureEnabled: enabled });
  }
};

export default {
  get,
  set,
  remove,
  clear,
  getAll,
  has,
  getSize,
  onChange,
  preferences
};
