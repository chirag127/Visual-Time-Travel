/**
 * Background script wrapper
 * This is a non-module script that imports the module-based background script
 */

// Create a dynamic import for the module-based background script
(async () => {
  try {
    // Import the module
    await import('./background.js');
    console.log('Background module loaded successfully');
  } catch (error) {
    console.error('Error loading background module:', error);
  }
})();
