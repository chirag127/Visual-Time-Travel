/**
 * Background script
 * Handles tab events and screenshot capture
 * @module background
 */

import api from "./utils/api.js";
import storage from "./utils/storage.js";
import screenshot from "./utils/screenshot.js";

// Track the last active tab to avoid duplicate captures
let lastActiveTabId = null;
let lastActiveTabUrl = null;
let processingTab = false;

/**
 * Initialize the extension
 */
const initialize = async () => {
    console.log("Visual Time Travel extension initialized");

    try {
        // Set default preferences if not set
        const prefs = await storage.preferences.get();
        console.log("Current preferences:", prefs);

        // Check authentication status
        const isAuth = await api.isAuthenticated();
        console.log("Is authenticated:", isAuth);

        // Set up tab change listeners
        console.log("Setting up tab event listeners");
        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);

        // Set up authentication state change listener
        storage.onChange((changes) => {
            if (changes.token) {
                console.log("Authentication state changed");
            }
        });

        // Test capture on startup with current tab
        const [currentTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (currentTab) {
            console.log("Current active tab:", currentTab.url);
        }
    } catch (error) {
        console.error("Error initializing extension:", error);
    }
};

/**
 * Handle tab activated event
 * @param {Object} activeInfo - Active tab info
 */
const handleTabActivated = async (activeInfo) => {
    try {
        console.log("Tab activated event:", activeInfo);

        // Skip if we're already processing a tab
        if (processingTab) {
            console.log("Already processing a tab, skipping");
            return;
        }
        processingTab = true;

        // Get the active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Skip if no tab
        if (!tab) {
            console.log("No active tab found");
            processingTab = false;
            return;
        }

        console.log("Active tab:", tab.id, tab.url);

        // Skip if same as last active tab
        if (tab.id === lastActiveTabId && tab.url === lastActiveTabUrl) {
            console.log("Same tab as last active tab, skipping");
            processingTab = false;
            return;
        }

        // Update last active tab
        lastActiveTabId = tab.id;
        lastActiveTabUrl = tab.url;

        // Process the tab change
        console.log("Processing tab change for:", tab.url);
        try {
            const tabResult = await screenshot.processTabChange(tab);
            console.log("Tab change processing result:", tabResult);

            // If the result indicates success, log it
            if (tabResult && tabResult.success) {
                console.log("Screenshot captured and saved successfully");
            } else if (tabResult) {
                console.warn(
                    "Screenshot capture failed:",
                    tabResult.message || tabResult.error
                );
            }
        } catch (error) {
            console.error("Error processing tab change:", error);
        } finally {
            processingTab = false;
        }
    } catch (error) {
        console.error("Error handling tab activated:", error);
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
        console.log("Tab updated event:", tabId, changeInfo, tab.url);

        // Only process if the tab is complete and has a URL
        if (changeInfo.status !== "complete") {
            console.log("Tab not complete yet, skipping");
            return;
        }

        // Skip if we're already processing a tab
        if (processingTab) {
            console.log("Already processing a tab, skipping");
            return;
        }
        processingTab = true;

        // Skip if not the active tab
        if (!tab.active) {
            console.log("Not the active tab, skipping");
            processingTab = false;
            return;
        }

        // Skip if same as last active tab URL
        if (tab.url === lastActiveTabUrl) {
            console.log("Same URL as last active tab, skipping");
            processingTab = false;
            return;
        }

        // Update last active tab
        lastActiveTabId = tab.id;
        lastActiveTabUrl = tab.url;

        // Process the tab change
        console.log("Processing tab change for:", tab.url);
        try {
            const result = await screenshot.processTabChange(tab);
            console.log("Tab change processing result:", result);

            // If the result indicates success, log it
            if (result && result.success) {
                console.log("Screenshot captured and saved successfully");
            } else if (result) {
                console.warn(
                    "Screenshot capture failed:",
                    result.message || result.error
                );
            }
        } catch (error) {
            console.error("Error processing tab change:", error);
        } finally {
            processingTab = false;
        }
    } catch (error) {
        console.error("Error handling tab updated:", error);
        processingTab = false;
    }
};

/**
 * Handle messages from popup or content scripts
 * @param {Object} message - Message
 * @param {Object} _sender - Sender (unused but required by Chrome API)
 * @param {Function} sendResponse - Send response function
 */
const handleMessage = async (message, _sender, sendResponse) => {
    try {
        console.log("Received message:", message);

        switch (message.action) {
            case "login":
                const { email, password } = message.data;
                const loginResult = await api.auth.login(email, password);
                sendResponse({ success: true, data: loginResult });
                break;

            case "logout":
                await api.auth.logout();
                sendResponse({ success: true });
                break;

            case "getCurrentUser":
                const user = await api.auth.getCurrentUser();
                sendResponse({ success: true, data: user });
                break;

            case "updatePreferences":
                const { preferences } = message.data;
                const updatedUser = await api.auth.updatePreferences(
                    preferences
                );

                // Also update local preferences
                await storage.preferences.set(preferences);

                sendResponse({ success: true, data: updatedUser });
                break;

            case "captureScreenshot":
                try {
                    const tab = await chrome.tabs.get(message.data.tabId);
                    console.log(
                        "Manual screenshot capture requested for tab:",
                        tab.id,
                        tab.url
                    );

                    // Process the tab change and get the result
                    const result = await screenshot.processTabChange(tab);
                    console.log("Screenshot processing result:", result);

                    // Send the response back to the popup
                    sendResponse(
                        result || {
                            success: true,
                            message:
                                "Screenshot may have been saved successfully",
                        }
                    );
                } catch (error) {
                    console.error(
                        "Error processing screenshot capture:",
                        error
                    );
                    sendResponse({
                        success: false,
                        error:
                            error.message ||
                            "Unknown error during screenshot capture",
                    });
                }
                break;

            case "isAuthenticated":
                const isAuth = await api.isAuthenticated();
                sendResponse({ success: true, data: isAuth });
                break;

            default:
                sendResponse({ success: false, error: "Unknown action" });
        }
    } catch (error) {
        console.error("Error handling message:", error);
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
