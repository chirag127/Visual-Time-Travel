/**
 * API utility module
 * Handles communication with the backend API
 * @module utils/api
 */

// Default API configuration
const API_CONFIG = {
    baseUrl: "https://visual-time-travel.onrender.com/api",
    timeout: 10000, // 10 seconds
};

/**
 * Get the API base URL
 * @returns {string} The API base URL
 */
const getApiBaseUrl = async () => {
    const { apiBaseUrl } = await chrome.storage.local.get("apiBaseUrl");
    return apiBaseUrl || API_CONFIG.baseUrl;
};

/**
 * Get the authentication token
 * @returns {Promise<string|null>} The authentication token or null if not logged in
 */
const getAuthToken = async () => {
    const { token } = await chrome.storage.local.get("token");
    return token || null;
};

/**
 * Set the authentication token
 * @param {string} token - The authentication token
 * @returns {Promise<void>}
 */
const setAuthToken = async (token) => {
    await chrome.storage.local.set({ token });
};

/**
 * Clear the authentication token
 * @returns {Promise<void>}
 */
const clearAuthToken = async () => {
    await chrome.storage.local.remove("token");
};

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
const isAuthenticated = async () => {
    const token = await getAuthToken();
    return !!token;
};

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.body] - Request body
 * @param {boolean} [options.requiresAuth=true] - Whether the request requires authentication
 * @param {number} [options.timeout] - Request timeout in milliseconds
 * @returns {Promise<Object>} Response data
 * @throws {Error} If the request fails
 */
const apiRequest = async (endpoint, options = {}) => {
    const {
        method = "GET",
        body,
        requiresAuth = true,
        timeout = API_CONFIG.timeout,
    } = options;

    const baseUrl = await getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const headers = {
        "Content-Type": "application/json",
    };

    // Add authentication token if required
    if (requiresAuth) {
        const token = await getAuthToken();
        if (!token) {
            throw new Error("Authentication required");
        }
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        // Clear timeout
        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        // Check if response is successful
        if (!response.ok) {
            throw new Error(data.message || "API request failed");
        }

        return data;
    } catch (error) {
        // Clear timeout
        clearTimeout(timeoutId);

        // Handle timeout
        if (error.name === "AbortError") {
            throw new Error("Request timeout");
        }

        // Rethrow error
        throw error;
    }
};

/**
 * Authentication API
 */
const auth = {
    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data and token
     */
    register: async (email, password) => {
        const response = await apiRequest("/auth/signup", {
            method: "POST",
            body: { email, password },
            requiresAuth: false,
        });

        // Save token
        if (response.data && response.data.token) {
            await setAuthToken(response.data.token);
        }

        return response.data;
    },

    /**
     * Login a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data and token
     */
    login: async (email, password) => {
        const response = await apiRequest("/auth/login", {
            method: "POST",
            body: { email, password },
            requiresAuth: false,
        });

        // Save token
        if (response.data && response.data.token) {
            await setAuthToken(response.data.token);
        }

        return response.data;
    },

    /**
     * Logout the current user
     * @returns {Promise<void>}
     */
    logout: async () => {
        await clearAuthToken();
    },

    /**
     * Get the current user
     * @returns {Promise<Object>} User data
     */
    getCurrentUser: async () => {
        const response = await apiRequest("/auth/me");
        return response.data;
    },

    /**
     * Update user preferences
     * @param {Object} preferences - User preferences
     * @returns {Promise<Object>} Updated user data
     */
    updatePreferences: async (preferences) => {
        const response = await apiRequest("/auth/preferences", {
            method: "PUT",
            body: { preferences },
        });
        return response.data;
    },
};

/**
 * History API
 */
const history = {
    /**
     * Upload a screenshot
     * @param {string} imageBase64 - Base64 encoded screenshot
     * @param {string} url - Page URL
     * @param {string} title - Page title
     * @param {string} [favicon] - Page favicon URL
     * @returns {Promise<Object>} Created history item
     */
    uploadScreenshot: async (imageBase64, url, title, favicon) => {
        const response = await apiRequest("/history/screenshot", {
            method: "POST",
            body: { imageBase64, url, title, favicon },
        });
        return response.data;
    },

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
    getUserHistory: async (options = {}) => {
        // Build query string
        const queryParams = new URLSearchParams();

        if (options.limit) queryParams.append("limit", options.limit);
        if (options.page) queryParams.append("page", options.page);
        if (options.domain) queryParams.append("domain", options.domain);
        if (options.search) queryParams.append("search", options.search);
        if (options.sortBy) queryParams.append("sortBy", options.sortBy);
        if (options.sortOrder)
            queryParams.append("sortOrder", options.sortOrder);

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/history?${queryString}` : "/history";

        const response = await apiRequest(endpoint);
        return response.data;
    },

    /**
     * Get user domains
     * @returns {Promise<Array>} List of domains with counts
     */
    getUserDomains: async () => {
        const response = await apiRequest("/history/domains");
        return response.data;
    },

    /**
     * Delete a history item - DISABLED
     * @param {string} id - History item ID
     * @returns {Promise<Object>} Result indicating deletion is disabled
     */
    deleteHistoryItem: async (id) => {
        console.log("History deletion is disabled");
        return { success: false, message: "History deletion is disabled" };
    },

    /**
     * Clear user history - DISABLED
     * @param {Object} [options] - Clear options
     * @returns {Promise<Object>} Result indicating deletion is disabled
     */
    clearUserHistory: async (options = {}) => {
        console.log("History deletion is disabled");
        return { success: false, message: "History deletion is disabled" };
    },
};

// Export API modules
export default {
    getApiBaseUrl,
    setApiBaseUrl: async (baseUrl) => {
        await chrome.storage.local.set({ apiBaseUrl: baseUrl });
    },
    isAuthenticated,
    auth,
    history,
};
