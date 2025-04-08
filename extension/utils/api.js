/**
 * API utility module
 * Handles API calls to the backend
 * @module utils/api
 */

import { getAuthToken } from "./auth.js";
import { getStorageItem } from "./storage.js";

/**
 * Get the base API URL
 * @returns {Promise<string>} The base API URL
 */
async function getApiBaseUrl() {
    try {
        // Try to get the API URL from storage
        const apiUrl = await getStorageItem("api_url");
        return apiUrl || "http://localhost:5000/api";
    } catch (error) {
        console.error("Error getting API URL:", error);
        return "http://localhost:5000/api";
    }
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.body] - Request body
 * @param {boolean} [options.auth=true] - Whether to include auth token
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
async function apiRequest(endpoint, options = {}) {
    const { method = "GET", body, auth = true } = options;

    // Get API base URL
    const apiBaseUrl = await getApiBaseUrl();

    // Build request URL
    const url = `${apiBaseUrl}${endpoint}`;

    // Build request headers
    const headers = {
        "Content-Type": "application/json",
    };

    // Add auth token if required
    if (auth) {
        const token = await getAuthToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        } else {
            throw new Error("Authentication required");
        }
    }

    // Build request options
    const requestOptions = {
        method,
        headers,
        credentials: "include",
    };

    // Add body if provided
    if (body) {
        requestOptions.body = JSON.stringify(body);
    }

    try {
        console.log(`Making API request to: ${url}`);

        // Make request
        const response = await fetch(url, requestOptions);

        // Log response status
        console.log(`API response status: ${response.status}`);

        // Parse response
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            throw new Error("Invalid response from server");
        }

        // Check if request was successful
        if (!response.ok) {
            const errorMessage =
                data?.message || data?.error || "Something went wrong";
            console.error("API error:", errorMessage);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error("API request failed:", error);
        // Make the error message more user-friendly
        if (error.message.includes("Failed to fetch")) {
            throw new Error(
                "Cannot connect to server. Please check your internet connection or try again later."
            );
        }
        throw error;
    }
}

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and token
 */
export async function register(email, password) {
    return apiRequest("/auth/signup", {
        method: "POST",
        body: { email, password },
        auth: false,
    });
}

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and token
 */
export async function login(email, password) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
    });
}

/**
 * Get current user
 * @returns {Promise<Object>} User data
 */
export async function getCurrentUser() {
    return apiRequest("/auth/me");
}

/**
 * Update user preferences
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} Updated user data
 */
export async function updatePreferences(preferences) {
    return apiRequest("/auth/preferences", {
        method: "PUT",
        body: { preferences },
    });
}

/**
 * Upload a screenshot
 * @param {string} imageBase64 - Base64 encoded screenshot
 * @param {string} url - Page URL
 * @param {string} title - Page title
 * @param {string} [favicon] - Page favicon URL
 * @returns {Promise<Object>} Created history item
 */
export async function uploadScreenshot(imageBase64, url, title, favicon) {
    return apiRequest("/history/screenshot", {
        method: "POST",
        body: { imageBase64, url, title, favicon },
    });
}

/**
 * Get user history
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Maximum number of items to return
 * @param {number} [options.page] - Page number
 * @param {string} [options.domain] - Filter by domain
 * @param {string} [options.search] - Search keyword
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order
 * @returns {Promise<Object>} History items and pagination info
 */
export async function getUserHistory(options = {}) {
    // Build query string
    const queryParams = new URLSearchParams();

    if (options.limit) queryParams.append("limit", options.limit);
    if (options.page) queryParams.append("page", options.page);
    if (options.domain) queryParams.append("domain", options.domain);
    if (options.search) queryParams.append("search", options.search);
    if (options.sortBy) queryParams.append("sortBy", options.sortBy);
    if (options.sortOrder) queryParams.append("sortOrder", options.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/history?${queryString}` : "/history";

    return apiRequest(endpoint);
}

/**
 * Get user domains
 * @returns {Promise<Object>} List of domains with counts
 */
export async function getUserDomains() {
    return apiRequest("/history/domains");
}

/**
 * Delete a history item
 * @param {string} id - History item ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteHistoryItem(id) {
    return apiRequest(`/history/${id}`, {
        method: "DELETE",
    });
}

/**
 * Clear user history
 * @param {Object} [options] - Clear options
 * @param {string} [options.domain] - Clear only items from this domain
 * @param {string} [options.before] - Clear only items before this date
 * @returns {Promise<Object>} Deletion result
 */
export async function clearUserHistory(options = {}) {
    // Build query string
    const queryParams = new URLSearchParams();

    if (options.domain) queryParams.append("domain", options.domain);
    if (options.before) queryParams.append("before", options.before);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/history?${queryString}` : "/history";

    return apiRequest(endpoint, {
        method: "DELETE",
    });
}
