/**
 * Popup script
 * Handles the popup UI and interactions
 * @module popup
 */

import api from "../utils/api.js";
import storage from "../utils/storage.js";

// DOM Elements
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const mainContent = document.getElementById("mainContent");
const historyContent = document.getElementById("historyContent");
const settingsContent = document.getElementById("settingsContent");

// Auth Elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const showSignupButton = document.getElementById("showSignupButton");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const signupButton = document.getElementById("signupButton");
const showLoginButton = document.getElementById("showLoginButton");
const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");

// Tab Elements
const historyTab = document.getElementById("historyTab");
const settingsTab = document.getElementById("settingsTab");

// History Elements
const manualSaveButton = document.getElementById("manualSaveButton");
const saveStatus = document.getElementById("saveStatus");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const domainFilter = document.getElementById("domainFilter");
const historyList = document.getElementById("historyList");
const prevPageButton = document.getElementById("prevPageButton");
const nextPageButton = document.getElementById("nextPageButton");
const paginationInfo = document.getElementById("paginationInfo");
const viewTimelineButton = document.getElementById("viewTimelineButton");

// Settings Elements
const captureEnabledToggle = document.getElementById("captureEnabledToggle");
const retentionDaysInput = document.getElementById("retentionDays");
const showBreadcrumbsToggle = document.getElementById("showBreadcrumbsToggle");
const apiBaseUrlInput = document.getElementById("apiBaseUrl");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const logoutButton = document.getElementById("logoutButton");
const darkModeToggle = document.getElementById("darkModeToggle");

// State
let currentPage = 1;
let totalPages = 1;
let currentDomain = "";
let currentSearch = "";
let historyItems = [];
let domains = [];
let isAuthenticated = false;

/**
 * Initialize the popup
 */
const initialize = async () => {
    console.log("Popup initialized");

    // Check if dark mode is enabled
    const preferences = await storage.preferences.get();
    if (preferences.darkMode) {
        document.body.classList.add("dark-mode");
        darkModeToggle.checked = true;
    }

    // Check authentication status
    isAuthenticated = await api.isAuthenticated();

    if (isAuthenticated) {
        showMainContent();
        loadUserData();
    } else {
        showLoginForm();
    }

    // Set up event listeners
    setupEventListeners();
};

/**
 * Set up event listeners
 */
const setupEventListeners = () => {
    // Auth
    loginButton.addEventListener("click", handleLogin);
    showSignupButton.addEventListener("click", () => {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
    });

    signupButton.addEventListener("click", handleSignup);
    showLoginButton.addEventListener("click", () => {
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
    });

    // Tabs
    historyTab.addEventListener("click", () => {
        historyTab.classList.add("active");
        settingsTab.classList.remove("active");
        historyContent.classList.remove("hidden");
        settingsContent.classList.add("hidden");
    });

    settingsTab.addEventListener("click", () => {
        settingsTab.classList.add("active");
        historyTab.classList.remove("active");
        settingsContent.classList.remove("hidden");
        historyContent.classList.add("hidden");
    });

    // Manual Save Button
    manualSaveButton.addEventListener("click", handleManualSave);

    // History
    searchButton.addEventListener("click", () => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        loadHistory();
    });

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            loadHistory();
        }
    });

    domainFilter.addEventListener("change", () => {
        currentDomain = domainFilter.value;
        currentPage = 1;
        loadHistory();
    });

    prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadHistory();
        }
    });

    nextPageButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadHistory();
        }
    });

    viewTimelineButton.addEventListener("click", openTimeline);

    // Settings
    saveSettingsButton.addEventListener("click", saveSettings);
    clearHistoryButton.addEventListener("click", confirmClearHistory);
    logoutButton.addEventListener("click", handleLogout);

    // Dark mode toggle
    darkModeToggle.addEventListener("change", toggleDarkMode);
};

/**
 * Handle login
 */
const handleLogin = async () => {
    try {
        loginError.textContent = "";

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            loginError.textContent = "Please enter email and password";
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        await api.auth.login(email, password);

        isAuthenticated = true;
        showMainContent();
        loadUserData();

        // Reset form
        emailInput.value = "";
        passwordInput.value = "";
    } catch (error) {
        console.error("Login error:", error);
        loginError.textContent = error.message || "Login failed";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
};

/**
 * Handle signup
 */
const handleSignup = async () => {
    try {
        signupError.textContent = "";

        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!email || !password || !confirmPassword) {
            signupError.textContent = "Please fill in all fields";
            return;
        }

        if (password !== confirmPassword) {
            signupError.textContent = "Passwords do not match";
            return;
        }

        signupButton.disabled = true;
        signupButton.textContent = "Creating account...";

        await api.auth.register(email, password);

        isAuthenticated = true;
        showMainContent();
        loadUserData();

        // Reset form
        signupEmailInput.value = "";
        signupPasswordInput.value = "";
        confirmPasswordInput.value = "";
    } catch (error) {
        console.error("Signup error:", error);
        signupError.textContent = error.message || "Signup failed";
    } finally {
        signupButton.disabled = false;
        signupButton.textContent = "Sign Up";
    }
};

/**
 * Handle logout
 */
const handleLogout = async () => {
    try {
        await api.auth.logout();
        isAuthenticated = false;
        showLoginForm();
    } catch (error) {
        console.error("Logout error:", error);
    }
};

/**
 * Show login form
 */
const showLoginForm = () => {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    mainContent.classList.add("hidden");
};

/**
 * Show main content
 */
const showMainContent = () => {
    loginForm.classList.add("hidden");
    signupForm.classList.add("hidden");
    mainContent.classList.remove("hidden");
    historyTab.classList.add("active");
    settingsTab.classList.remove("active");
    historyContent.classList.remove("hidden");
    settingsContent.classList.add("hidden");
};

/**
 * Load user data
 */
const loadUserData = async () => {
    try {
        // Load user preferences
        const preferences = await storage.preferences.get();

        // Set settings form values
        captureEnabledToggle.checked = preferences.captureEnabled;
        retentionDaysInput.value = preferences.retentionDays;
        showBreadcrumbsToggle.checked = preferences.showBreadcrumbs;
        apiBaseUrlInput.value =
            preferences.apiBaseUrl || (await api.getApiBaseUrl());

        // Load domains for filter
        await loadDomains();

        // Load history
        await loadHistory();
    } catch (error) {
        console.error("Error loading user data:", error);
    }
};

/**
 * Load domains for filter
 */
const loadDomains = async () => {
    try {
        domains = await api.history.getUserDomains();

        // Clear existing options except the first one
        while (domainFilter.options.length > 1) {
            domainFilter.remove(1);
        }

        // Add domain options
        domains.forEach((domain) => {
            const option = document.createElement("option");
            option.value = domain.domain;
            option.textContent = `${domain.domain} (${domain.count})`;
            domainFilter.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading domains:", error);
    }
};

/**
 * Load history
 */
const loadHistory = async () => {
    try {
        const result = await api.history.getUserHistory({
            limit: 10,
            page: currentPage,
            domain: currentDomain,
            search: currentSearch,
            sortBy: "timestamp",
            sortOrder: "desc",
        });

        historyItems = result.items;
        totalPages = result.pagination.totalPages;
        currentPage = result.pagination.page;

        // Update pagination
        updatePagination(result.pagination);

        // Render history items
        renderHistoryItems(historyItems);
    } catch (error) {
        console.error("Error loading history:", error);
    }
};

/**
 * Update pagination controls
 * @param {Object} pagination - Pagination info
 */
const updatePagination = (pagination) => {
    paginationInfo.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    prevPageButton.disabled = !pagination.hasPrevPage;
    nextPageButton.disabled = !pagination.hasNextPage;
};

/**
 * Render history items
 * @param {Array} items - History items
 */
const renderHistoryItems = (items) => {
    // Clear existing items
    historyList.innerHTML = "";

    if (items.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.innerHTML = "<p>No history items found</p>";
        historyList.appendChild(emptyState);
        return;
    }

    // Add items
    items.forEach((item) => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();

        historyItem.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title}" class="history-thumbnail">
      <div class="history-details">
        <div class="history-title">${item.title}</div>
        <div class="history-url">${item.url}</div>
        <div class="history-time">${formattedDate} ${formattedTime}</div>
      </div>
      <div class="history-actions">
        <button class="btn btn-icon visit-btn" data-url="${item.url}" title="Visit page">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        <button class="btn btn-icon delete-btn" data-id="${item._id}" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

        historyList.appendChild(historyItem);

        // Add event listeners
        const visitBtn = historyItem.querySelector(".visit-btn");
        visitBtn.addEventListener("click", () => {
            chrome.tabs.create({ url: item.url });
        });

        const deleteBtn = historyItem.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => {
            confirmDeleteHistoryItem(item._id);
        });
    });
};

/**
 * Confirm delete history item
 * @param {string} id - History item ID
 */
const confirmDeleteHistoryItem = async (id) => {
    if (confirm("Are you sure you want to delete this history item?")) {
        try {
            await api.history.deleteHistoryItem(id);
            loadHistory();
        } catch (error) {
            console.error("Error deleting history item:", error);
            alert("Failed to delete history item");
        }
    }
};

/**
 * Confirm clear history
 */
const confirmClearHistory = () => {
    if (
        confirm(
            "Are you sure you want to clear your history? This cannot be undone."
        )
    ) {
        clearHistory();
    }
};

/**
 * Clear history
 */
const clearHistory = async () => {
    try {
        await api.history.clearUserHistory();
        loadHistory();
        loadDomains();
    } catch (error) {
        console.error("Error clearing history:", error);
        alert("Failed to clear history");
    }
};

/**
 * Save settings
 */
const saveSettings = async () => {
    try {
        const captureEnabled = captureEnabledToggle.checked;
        const retentionDays = parseInt(retentionDaysInput.value);
        const showBreadcrumbs = showBreadcrumbsToggle.checked;
        const apiBaseUrl = apiBaseUrlInput.value.trim();

        // Validate inputs
        if (isNaN(retentionDays) || retentionDays < 1 || retentionDays > 365) {
            alert("Retention days must be between 1 and 365");
            return;
        }

        if (!apiBaseUrl) {
            alert("API Base URL is required");
            return;
        }

        // Save preferences locally
        await storage.preferences.set({
            captureEnabled,
            retentionDays,
            showBreadcrumbs,
            apiBaseUrl,
        });

        // Update API base URL
        await api.setApiBaseUrl(apiBaseUrl);

        // Save preferences on server
        await api.auth.updatePreferences({
            captureEnabled,
            retentionDays,
            showBreadcrumbs,
        });

        alert("Settings saved successfully");
    } catch (error) {
        console.error("Error saving settings:", error);
        alert("Failed to save settings");
    }
};

/**
 * Toggle dark mode
 */
const toggleDarkMode = async () => {
    const isDarkMode = darkModeToggle.checked;

    if (isDarkMode) {
        document.body.classList.add("dark-mode");
    } else {
        document.body.classList.remove("dark-mode");
    }

    // Save preference
    await storage.preferences.set({ darkMode: isDarkMode });
};

/**
 * Handle manual save button click
 */
const handleManualSave = async () => {
    try {
        // Show loading state
        manualSaveButton.disabled = true;
        saveStatus.textContent = "Saving...";
        saveStatus.className = "save-status";

        // Get current tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        if (!tab) {
            throw new Error("No active tab found");
        }

        // Send message to background script to capture screenshot
        const response = await chrome.runtime.sendMessage({
            action: "captureScreenshot",
            data: { tabId: tab.id },
        });

        if (!response || !response.success) {
            throw new Error(response?.error || "Failed to save screenshot");
        }

        // Show success message
        saveStatus.textContent = "Screenshot saved successfully!";
        saveStatus.className = "save-status success";

        // Reload history after a short delay
        setTimeout(() => {
            loadHistory();
        }, 1000);
    } catch (error) {
        console.error("Error saving screenshot:", error);
        saveStatus.textContent = `Error: ${error.message}`;
        saveStatus.className = "save-status error";
    } finally {
        // Re-enable button after a delay
        setTimeout(() => {
            manualSaveButton.disabled = false;
        }, 1000);
    }
};

/**
 * Open timeline page
 */
const openTimeline = () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("timeline/timeline.html"),
    });
};

// Initialize the popup
document.addEventListener("DOMContentLoaded", initialize);
