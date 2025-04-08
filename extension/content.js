/**
 * Content script
 * Handles page interactions
 */

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageInfo') {
    // Get page info
    const pageInfo = {
      title: document.title,
      url: window.location.href,
      favicon: getFaviconUrl()
    };
    
    sendResponse(pageInfo);
  }
});

/**
 * Get the favicon URL
 * @returns {string|null} Favicon URL or null if not found
 */
function getFaviconUrl() {
  // Try to get favicon from link tags
  const linkTags = document.querySelectorAll('link[rel*="icon"]');
  
  if (linkTags.length > 0) {
    // Sort by size (prefer larger icons)
    const icons = Array.from(linkTags).map(link => {
      const href = link.href;
      const sizes = link.getAttribute('sizes');
      let size = 0;
      
      if (sizes) {
        const match = sizes.match(/(\d+)x(\d+)/);
        if (match) {
          size = parseInt(match[1]);
        }
      }
      
      return { href, size };
    });
    
    // Sort by size (descending)
    icons.sort((a, b) => b.size - a.size);
    
    return icons[0].href;
  }
  
  // Fallback to default favicon
  return `${window.location.origin}/favicon.ico`;
}
