/**
 * Content script
 * Runs in the context of web pages
 * @module content
 */

// Store the current page URL
const currentUrl = window.location.href;

/**
 * Initialize the content script
 */
const initialize = () => {
  console.log('Visual Time Travel content script initialized');
  
  // Send message to background script that page has loaded
  chrome.runtime.sendMessage({
    action: 'pageLoaded',
    data: {
      url: currentUrl,
      title: document.title,
      favicon: getFaviconUrl()
    }
  });
  
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(handleMessage);
};

/**
 * Get the favicon URL
 * @returns {string|null} Favicon URL or null if not found
 */
const getFaviconUrl = () => {
  // Try to find favicon link
  const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  if (faviconLink && faviconLink.href) {
    return faviconLink.href;
  }
  
  // Default to /favicon.ico
  return `${window.location.origin}/favicon.ico`;
};

/**
 * Handle messages from the background script
 * @param {Object} message - Message
 * @param {Object} sender - Sender
 * @param {Function} sendResponse - Send response function
 */
const handleMessage = (message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.action) {
    case 'getPageInfo':
      sendResponse({
        url: window.location.href,
        title: document.title,
        favicon: getFaviconUrl()
      });
      break;
      
    default:
      sendResponse({ error: 'Unknown action' });
  }
};

// Initialize the content script
initialize();
