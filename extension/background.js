/**
 * Background script
 * Handles tab events and screenshot capture
 */

import { captureScreenshot, getFaviconUrl, shouldCaptureUrl } from './utils/screenshot.js';
import { uploadScreenshot } from './utils/api.js';
import { isLoggedIn } from './utils/auth.js';
import { getUserPreferences } from './utils/storage.js';

// Keep track of the last captured tab
let lastCapturedTabId = null;
let lastCapturedUrl = null;

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Check if user is logged in
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      console.log('User not logged in, skipping screenshot capture');
      return;
    }
    
    // Get user preferences
    const preferences = await getUserPreferences();
    if (!preferences.captureEnabled) {
      console.log('Screenshot capture disabled, skipping');
      return;
    }
    
    // Get the active tab
    const tab = await new Promise((resolve) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        resolve(tab);
      });
    });
    
    // Skip if tab is not fully loaded
    if (tab.status !== 'complete') {
      console.log('Tab not fully loaded, skipping screenshot capture');
      return;
    }
    
    // Skip if URL should not be captured
    if (!shouldCaptureUrl(tab.url)) {
      console.log('URL should not be captured, skipping');
      return;
    }
    
    // Skip if this tab was just captured
    if (tab.id === lastCapturedTabId && tab.url === lastCapturedUrl) {
      console.log('Tab was just captured, skipping');
      return;
    }
    
    // Wait a moment for the tab to render
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Capture screenshot
    const imageBase64 = await captureScreenshot();
    
    // Get favicon URL
    const favicon = getFaviconUrl(tab);
    
    // Upload screenshot
    await uploadScreenshot(imageBase64, tab.url, tab.title, favicon);
    
    // Update last captured tab
    lastCapturedTabId = tab.id;
    lastCapturedUrl = tab.url;
    
    console.log('Screenshot captured and uploaded for:', tab.url);
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only handle when the tab is fully loaded
  if (changeInfo.status === 'complete') {
    // Reset last captured tab if the URL changed
    if (tabId === lastCapturedTabId && tab.url !== lastCapturedUrl) {
      lastCapturedTabId = null;
      lastCapturedUrl = null;
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureCurrentTab') {
    captureCurrentTab()
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

/**
 * Capture the current tab
 * @returns {Promise<Object>} Result of the capture
 */
async function captureCurrentTab() {
  try {
    // Check if user is logged in
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      throw new Error('User not logged in');
    }
    
    // Get the active tab
    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs);
      });
    });
    
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const tab = tabs[0];
    
    // Skip if URL should not be captured
    if (!shouldCaptureUrl(tab.url)) {
      throw new Error('This URL cannot be captured');
    }
    
    // Capture screenshot
    const imageBase64 = await captureScreenshot();
    
    // Get favicon URL
    const favicon = getFaviconUrl(tab);
    
    // Upload screenshot
    const result = await uploadScreenshot(imageBase64, tab.url, tab.title, favicon);
    
    // Update last captured tab
    lastCapturedTabId = tab.id;
    lastCapturedUrl = tab.url;
    
    return result;
  } catch (error) {
    console.error('Error capturing current tab:', error);
    throw error;
  }
}
