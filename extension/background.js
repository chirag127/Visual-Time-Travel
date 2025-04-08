/**
 * Background script
 * Handles tab events and screenshot capture
 * @module background
 */

import api from './utils/api.js';
import storage from './utils/storage.js';
import screenshot from './utils/screenshot.js';

// Track the last active tab to avoid duplicate captures
let lastActiveTabId = null;
let lastActiveTabUrl = null;
let processingTab = false;

/**
 * Initialize the extension
 */
const initialize = async () => {
  console.log('Visual Time Travel extension initialized');
  
  // Set up tab change listeners
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);
  
  // Set up authentication state change listener
  storage.onChange((changes) => {
    if (changes.token) {
      console.log('Authentication state changed');
    }
  });
};

/**
 * Handle tab activated event
 * @param {Object} activeInfo - Active tab info
 */
const handleTabActivated = async (activeInfo) => {
  try {
    // Skip if we're already processing a tab
    if (processingTab) return;
    processingTab = true;
    
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Skip if no tab or same as last active tab
    if (!tab || tab.id === lastActiveTabId && tab.url === lastActiveTabUrl) {
      processingTab = false;
      return;
    }
    
    // Update last active tab
    lastActiveTabId = tab.id;
    lastActiveTabUrl = tab.url;
    
    // Process the tab change
    await screenshot.processTabChange(tab);
    
    processingTab = false;
  } catch (error) {
    console.error('Error handling tab activated:', error);
    processingTab = false;
  }
};

/**
 * Handle tab updated event
 * @param {number} tabId - Tab ID
 * @param {Object} changeInfo - Change info
 * @param {chrome.tabs.Tab} tab - Tab
 */
const handleTabUpdated = async (tabId, changeInfo, tab) => {
  try {
    // Only process if the tab is complete and has a URL change
    if (changeInfo.status !== 'complete' || !changeInfo.url) return;
    
    // Skip if we're already processing a tab
    if (processingTab) return;
    processingTab = true;
    
    // Skip if not the active tab
    if (!tab.active) {
      processingTab = false;
      return;
    }
    
    // Skip if same as last active tab URL
    if (tab.url === lastActiveTabUrl) {
      processingTab = false;
      return;
    }
    
    // Update last active tab
    lastActiveTabId = tab.id;
    lastActiveTabUrl = tab.url;
    
    // Process the tab change
    await screenshot.processTabChange(tab);
    
    processingTab = false;
  } catch (error) {
    console.error('Error handling tab updated:', error);
    processingTab = false;
  }
};

/**
 * Handle messages from popup or content scripts
 * @param {Object} message - Message
 * @param {Object} sender - Sender
 * @param {Function} sendResponse - Send response function
 */
const handleMessage = async (message, sender, sendResponse) => {
  try {
    console.log('Received message:', message);
    
    switch (message.action) {
      case 'login':
        const { email, password } = message.data;
        const loginResult = await api.auth.login(email, password);
        sendResponse({ success: true, data: loginResult });
        break;
        
      case 'logout':
        await api.auth.logout();
        sendResponse({ success: true });
        break;
        
      case 'getCurrentUser':
        const user = await api.auth.getCurrentUser();
        sendResponse({ success: true, data: user });
        break;
        
      case 'updatePreferences':
        const { preferences } = message.data;
        const updatedUser = await api.auth.updatePreferences(preferences);
        
        // Also update local preferences
        await storage.preferences.set(preferences);
        
        sendResponse({ success: true, data: updatedUser });
        break;
        
      case 'captureScreenshot':
        const tab = await chrome.tabs.get(message.data.tabId);
        await screenshot.processTabChange(tab);
        sendResponse({ success: true });
        break;
        
      case 'isAuthenticated':
        const isAuth = await api.isAuthenticated();
        sendResponse({ success: true, data: isAuth });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep the message channel open for async response
};

// Set up message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle the message asynchronously
  handleMessage(message, sender, sendResponse);
  return true; // Keep the message channel open for async response
});

// Initialize the extension
initialize();
