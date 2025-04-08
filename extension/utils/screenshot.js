/**
 * Screenshot utility module
 * Handles capturing screenshots of tabs
 * @module utils/screenshot
 */

import api from "./api.js";
import storage from "./storage.js";

/**
 * Capture a screenshot of the current tab
 * @returns {Promise<string>} Base64 encoded screenshot
 */
const captureVisibleTab = async () => {
    try {
        console.log("Attempting to capture visible tab");

        // Capture the visible tab
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
            format: "png",
        });

        console.log("Screenshot captured successfully");

        // Convert data URL to base64 string (remove the prefix)
        const base64 = dataUrl.replace(
            /^data:image\/(png|jpeg|jpg);base64,/,
            ""
        );

        return base64;
    } catch (error) {
        console.error("Error capturing screenshot:", error);
        throw error;
    }
};

/**
 * Get the favicon URL for a tab
 * @param {chrome.tabs.Tab} tab - Chrome tab
 * @returns {string|null} Favicon URL or null if not available
 */
const getFaviconUrl = (tab) => {
    if (tab.favIconUrl && tab.favIconUrl.startsWith("http")) {
        return tab.favIconUrl;
    }
    return null;
};

/**
 * Process a tab change and capture screenshot
 * @param {chrome.tabs.Tab} tab - The active tab
 * @returns {Promise<Object>} Result object with success status and message
 */
const processTabChange = async (tab) => {
    try {
        console.log("Processing tab change for:", tab.url);

        if (!tab || !tab.url) {
            const error = new Error("Invalid tab or missing URL");
            console.error(error);
            return { success: false, error: error.message };
        }

        // Check if capture is enabled in preferences
        const captureEnabled = await storage.preferences.isCaptureEnabled();
        console.log("Screenshot capture enabled:", captureEnabled);

        if (!captureEnabled) {
            console.log("Screenshot capture is disabled");
            return {
                success: false,
                message: "Screenshot capture is disabled",
            };
        }

        // Check if user is authenticated
        const isAuthenticated = await api.isAuthenticated();
        console.log("User is authenticated:", isAuthenticated);

        if (!isAuthenticated) {
            console.log("User is not authenticated");
            return { success: false, message: "User is not authenticated" };
        }

        // Skip chrome:// and edge:// URLs
        if (
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("edge://") ||
            tab.url.startsWith("about:") ||
            tab.url.startsWith("chrome-extension://")
        ) {
            console.log("Skipping browser internal page:", tab.url);
            return {
                success: false,
                message: "Cannot capture browser internal pages",
            };
        }

        // Add a small delay to ensure the page is fully loaded
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
            // Capture screenshot
            console.log("Capturing screenshot for:", tab.url);
            const imageBase64 = await captureVisibleTab();

            if (!imageBase64) {
                const error = new Error(
                    "Failed to capture screenshot - empty base64 data"
                );
                console.error(error);
                return { success: false, error: error.message };
            }

            console.log(
                "Screenshot captured, base64 length:",
                imageBase64.length
            );

            // Get favicon URL
            const favicon = getFaviconUrl(tab);

            // Upload to server
            console.log("Uploading screenshot to server");
            const uploadResult = await api.history.uploadScreenshot(
                imageBase64,
                tab.url,
                tab.title || "Untitled Page",
                favicon
            );

            console.log("Screenshot uploaded successfully:", uploadResult);
            return {
                success: true,
                message: "Screenshot captured and uploaded successfully",
                data: uploadResult,
            };
        } catch (captureError) {
            console.error("Error during capture or upload:", captureError);
            return {
                success: false,
                error: captureError.message || "Error during capture or upload",
            };
        }
    } catch (error) {
        console.error("Error processing tab change:", error);
        return {
            success: false,
            error: error.message || "Unknown error processing tab change",
        };
    }
};

export default {
    captureVisibleTab,
    getFaviconUrl,
    processTabChange,
};
