# Visual Time Travel Extension Installation Guide

This guide will help you install and set up the Visual Time Travel browser extension.

## Prerequisites

-   Chrome, Edge, or Firefox browser
-   Backend server running (see main README.md for backend setup)

## Installation Steps

### Chrome/Edge Installation

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" button
5. Select the `extension` directory from the Visual Time Travel project
6. The extension should now appear in your browser toolbar

### Firefox Installation

1. Open Firefox browser
2. Navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select any file in the `extension` directory (e.g., manifest.json)
5. The extension should now appear in your browser toolbar

## Configuration

1. Click on the Visual Time Travel icon in your browser toolbar
2. Register a new account or log in with your existing account
3. In the Settings tab, configure the following:
    - API Base URL: Set this to your backend server URL (e.g., `https://visual-time-travel.onrender.com/api`)
    - Screenshot Capture: Enable/disable automatic screenshot capture
    - History Retention: Set how long to keep your browsing history (in days)
    - Show Breadcrumbs: Enable/disable navigation breadcrumbs
4. Click "Save Settings" to apply your changes

## Usage

1. Browse the web as usual
2. The extension will automatically capture screenshots when you switch tabs
3. Click the extension icon to view your visual browsing history
4. Use the search and filter options to find specific history items
5. Click on a history item to view details and revisit the page
6. Use the "View Full Timeline" button to open the timeline page

## Troubleshooting

### Extension Not Working

1. Check that the backend server is running
2. Verify the API Base URL in the extension settings
3. Make sure you're logged in to the extension
4. Check the browser console for any error messages

### Screenshots Not Being Captured

1. Ensure screenshot capture is enabled in the settings
2. Check that you're logged in to the extension
3. Some pages may block screenshot capture for security reasons
4. Check the browser console for any error messages

### Can't Log In

1. Verify that the backend server is running
2. Check the API Base URL in the extension settings
3. Make sure you're using the correct email and password
4. Check the browser console for any error messages

## Testing

You can test the extension functionality using the built-in test script:

1. Open the browser console (F12 or Ctrl+Shift+J)
2. Navigate to the "Console" tab
3. Run the following command to load the test script:
    ```javascript
    fetch(chrome.runtime.getURL("tests/test.js"))
        .then((response) => response.text())
        .then((text) => eval(text));
    ```
4. Run the tests using the following commands:
    ```javascript
    visualTimeTravel.testAPI();
    visualTimeTravel.testScreenshot();
    visualTimeTravel.testStorage();
    visualTimeTravel.runAllTests();
    ```

## Uninstallation

### Chrome/Edge

1. Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
2. Find the Visual Time Travel extension
3. Click "Remove" to uninstall

### Firefox

1. Navigate to `about:addons`
2. Find the Visual Time Travel extension
3. Click "Remove" to uninstall

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository:
[https://github.com/chirag127/visual-time-travel/issues](https://github.com/chirag127/visual-time-travel/issues)
