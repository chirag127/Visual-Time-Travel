/**
 * Timeline script
 * Handles the timeline UI and interactions
 * @module timeline
 */

import api from '../utils/api.js';
import storage from '../utils/storage.js';

// DOM Elements
const timeline = document.getElementById('timeline');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const domainFilter = document.getElementById('domainFilter');
const dateFilter = document.getElementById('dateFilter');
const darkModeToggle = document.getElementById('darkModeToggle');
const loadMoreButton = document.getElementById('loadMoreButton');
const paginationInfo = document.getElementById('paginationInfo');
const refreshButton = document.getElementById('refreshButton');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const settingsButton = document.getElementById('settingsButton');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const captureEnabledToggle = document.getElementById('captureEnabledToggle');
const retentionDaysInput = document.getElementById('retentionDays');
const showBreadcrumbsToggle = document.getElementById('showBreadcrumbsToggle');
const apiBaseUrlInput = document.getElementById('apiBaseUrl');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const cancelSettingsButton = document.getElementById('cancelSettingsButton');

// Preview Modal Elements
const previewModal = document.getElementById('previewModal');
const closePreviewButton = document.getElementById('closePreviewButton');
const previewTitle = document.getElementById('previewTitle');
const previewImage = document.getElementById('previewImage');
const previewUrl = document.getElementById('previewUrl');
const previewTime = document.getElementById('previewTime');
const visitPageButton = document.getElementById('visitPageButton');
const deleteItemButton = document.getElementById('deleteItemButton');

// Confirmation Modal Elements
const confirmationModal = document.getElementById('confirmationModal');
const closeConfirmationButton = document.getElementById('closeConfirmationButton');
const confirmationMessage = document.getElementById('confirmationMessage');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');

// State
let currentPage = 1;
let totalItems = 0;
let loadedItems = 0;
let currentDomain = '';
let currentSearch = '';
let currentDateFilter = '';
let historyItems = [];
let domains = [];
let isAuthenticated = false;
let currentItemId = null;
let confirmationCallback = null;

/**
 * Initialize the timeline
 */
const initialize = async () => {
  console.log('Timeline initialized');
  
  // Check if dark mode is enabled
  const preferences = await storage.preferences.get();
  if (preferences.darkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
  }
  
  // Check authentication status
  isAuthenticated = await api.isAuthenticated();
  
  if (isAuthenticated) {
    // Load user data
    loadUserData();
  } else {
    // Redirect to login
    window.location.href = chrome.runtime.getURL('popup/popup.html');
  }
  
  // Set up event listeners
  setupEventListeners();
};

/**
 * Set up event listeners
 */
const setupEventListeners = () => {
  // Search and filters
  searchButton.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadedItems = 0;
    loadHistory(true);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadedItems = 0;
      loadHistory(true);
    }
  });
  
  domainFilter.addEventListener('change', () => {
    currentDomain = domainFilter.value;
    currentPage = 1;
    loadedItems = 0;
    loadHistory(true);
  });
  
  dateFilter.addEventListener('change', () => {
    currentDateFilter = dateFilter.value;
    currentPage = 1;
    loadedItems = 0;
    loadHistory(true);
  });
  
  // Load more
  loadMoreButton.addEventListener('click', () => {
    currentPage++;
    loadHistory(false);
  });
  
  // Refresh
  refreshButton.addEventListener('click', () => {
    currentPage = 1;
    loadedItems = 0;
    loadHistory(true);
  });
  
  // Clear history
  clearHistoryButton.addEventListener('click', () => {
    showConfirmationModal(
      'Are you sure you want to clear your history? This cannot be undone.',
      clearHistory
    );
  });
  
  // Settings
  settingsButton.addEventListener('click', showSettingsModal);
  closeSettingsButton.addEventListener('click', hideSettingsModal);
  cancelSettingsButton.addEventListener('click', hideSettingsModal);
  saveSettingsButton.addEventListener('click', saveSettings);
  
  // Preview modal
  closePreviewButton.addEventListener('click', hidePreviewModal);
  visitPageButton.addEventListener('click', visitCurrentPage);
  deleteItemButton.addEventListener('click', () => {
    hidePreviewModal();
    showConfirmationModal(
      'Are you sure you want to delete this history item?',
      () => deleteHistoryItem(currentItemId)
    );
  });
  
  // Confirmation modal
  closeConfirmationButton.addEventListener('click', hideConfirmationModal);
  cancelButton.addEventListener('click', hideConfirmationModal);
  confirmButton.addEventListener('click', () => {
    if (confirmationCallback) {
      confirmationCallback();
    }
    hideConfirmationModal();
  });
  
  // Dark mode toggle
  darkModeToggle.addEventListener('change', toggleDarkMode);
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
    apiBaseUrlInput.value = preferences.apiBaseUrl || await api.getApiBaseUrl();
    
    // Load domains for filter
    await loadDomains();
    
    // Load history
    await loadHistory(true);
  } catch (error) {
    console.error('Error loading user data:', error);
    showError('Failed to load user data. Please try again later.');
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
    domains.forEach(domain => {
      const option = document.createElement('option');
      option.value = domain.domain;
      option.textContent = `${domain.domain} (${domain.count})`;
      domainFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading domains:', error);
    showError('Failed to load domains. Please try again later.');
  }
};

/**
 * Load history
 * @param {boolean} reset - Whether to reset the timeline
 */
const loadHistory = async (reset = false) => {
  try {
    // Show loading state
    if (reset) {
      timeline.innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
    }
    
    // Get date filter
    const dateRange = getDateRangeFromFilter(currentDateFilter);
    
    // Load history
    const result = await api.history.getUserHistory({
      limit: 20,
      page: currentPage,
      domain: currentDomain,
      search: currentSearch,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      ...(dateRange && { before: dateRange.before, after: dateRange.after })
    });
    
    // Update state
    if (reset) {
      historyItems = result.items;
      loadedItems = result.items.length;
    } else {
      historyItems = [...historyItems, ...result.items];
      loadedItems += result.items.length;
    }
    
    totalItems = result.pagination.total;
    
    // Update pagination
    updatePagination();
    
    // Render history items
    renderTimeline(reset);
  } catch (error) {
    console.error('Error loading history:', error);
    showError('Failed to load history. Please try again later.');
  }
};

/**
 * Get date range from filter
 * @param {string} filter - Date filter
 * @returns {Object|null} Date range or null
 */
const getDateRangeFromFilter = (filter) => {
  if (!filter) return null;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return {
        after: today.toISOString(),
        before: now.toISOString()
      };
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        after: yesterday.toISOString(),
        before: today.toISOString()
      };
      
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return {
        after: weekStart.toISOString(),
        before: now.toISOString()
      };
      
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        after: monthStart.toISOString(),
        before: now.toISOString()
      };
      
    default:
      return null;
  }
};

/**
 * Update pagination
 */
const updatePagination = () => {
  paginationInfo.textContent = `Showing ${loadedItems} of ${totalItems} items`;
  loadMoreButton.disabled = loadedItems >= totalItems;
  loadMoreButton.style.display = loadedItems >= totalItems ? 'none' : 'block';
};

/**
 * Render timeline
 * @param {boolean} reset - Whether to reset the timeline
 */
const renderTimeline = (reset = false) => {
  if (reset) {
    timeline.innerHTML = '';
  }
  
  if (historyItems.length === 0) {
    timeline.innerHTML = `
      <div class="empty-state">
        <p>No history items found</p>
        <button id="refreshButton" class="btn btn-secondary">Refresh</button>
      </div>
    `;
    
    // Re-attach event listener
    document.getElementById('refreshButton').addEventListener('click', () => {
      currentPage = 1;
      loadedItems = 0;
      loadHistory(true);
    });
    
    return;
  }
  
  // Group items by day
  const itemsByDay = groupItemsByDay(historyItems);
  
  // Clear timeline if resetting
  if (reset) {
    timeline.innerHTML = '';
  }
  
  // Render each day
  Object.keys(itemsByDay).forEach(day => {
    // Skip if day already exists
    if (!reset && document.getElementById(`day-${day}`)) {
      const dayElement = document.getElementById(`day-${day}`);
      const timelineItems = dayElement.querySelector('.timeline-items');
      
      // Add new items to existing day
      itemsByDay[day].forEach(item => {
        // Skip if item already exists
        if (document.getElementById(`item-${item._id}`)) {
          return;
        }
        
        const itemElement = createTimelineItemElement(item);
        timelineItems.appendChild(itemElement);
      });
      
      return;
    }
    
    // Create day element
    const dayElement = document.createElement('div');
    dayElement.className = 'timeline-day';
    dayElement.id = `day-${day}`;
    
    // Format day title
    const dayDate = new Date(day);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dayTitle = dayDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (dayDate.toDateString() === today.toDateString()) {
      dayTitle = `Today - ${dayTitle}`;
    } else if (dayDate.toDateString() === yesterday.toDateString()) {
      dayTitle = `Yesterday - ${dayTitle}`;
    }
    
    dayElement.innerHTML = `
      <div class="day-header">
        <div class="day-title">${dayTitle}</div>
        <div class="day-line"></div>
      </div>
      <div class="timeline-items"></div>
    `;
    
    // Add items to day
    const timelineItems = dayElement.querySelector('.timeline-items');
    itemsByDay[day].forEach(item => {
      const itemElement = createTimelineItemElement(item);
      timelineItems.appendChild(itemElement);
    });
    
    // Add day to timeline
    timeline.appendChild(dayElement);
  });
};

/**
 * Group items by day
 * @param {Array} items - History items
 * @returns {Object} Items grouped by day
 */
const groupItemsByDay = (items) => {
  const groups = {};
  
  items.forEach(item => {
    const date = new Date(item.timestamp);
    const day = date.toISOString().split('T')[0];
    
    if (!groups[day]) {
      groups[day] = [];
    }
    
    groups[day].push(item);
  });
  
  // Sort days in descending order
  return Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {});
};

/**
 * Create timeline item element
 * @param {Object} item - History item
 * @returns {HTMLElement} Timeline item element
 */
const createTimelineItemElement = (item) => {
  const itemElement = document.createElement('div');
  itemElement.className = 'timeline-item';
  itemElement.id = `item-${item._id}`;
  
  const date = new Date(item.timestamp);
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  itemElement.innerHTML = `
    <img src="${item.imageUrl}" alt="${item.title}" class="timeline-thumbnail">
    <div class="timeline-details">
      <div class="timeline-title">${item.title}</div>
      <div class="timeline-url">${item.url}</div>
      <div class="timeline-time">${formattedTime}</div>
    </div>
  `;
  
  // Add click event to show preview
  itemElement.addEventListener('click', () => {
    showPreviewModal(item);
  });
  
  return itemElement;
};

/**
 * Show preview modal
 * @param {Object} item - History item
 */
const showPreviewModal = (item) => {
  currentItemId = item._id;
  
  previewTitle.textContent = item.title;
  previewImage.src = item.imageUrl;
  previewUrl.textContent = item.url;
  
  const date = new Date(item.timestamp);
  previewTime.textContent = date.toLocaleString();
  
  visitPageButton.onclick = () => {
    chrome.tabs.create({ url: item.url });
    hidePreviewModal();
  };
  
  previewModal.style.display = 'block';
};

/**
 * Hide preview modal
 */
const hidePreviewModal = () => {
  previewModal.style.display = 'none';
  currentItemId = null;
};

/**
 * Visit current page
 */
const visitCurrentPage = () => {
  const item = historyItems.find(item => item._id === currentItemId);
  if (item) {
    chrome.tabs.create({ url: item.url });
    hidePreviewModal();
  }
};

/**
 * Delete history item
 * @param {string} id - History item ID
 */
const deleteHistoryItem = async (id) => {
  try {
    await api.history.deleteHistoryItem(id);
    
    // Remove item from list
    historyItems = historyItems.filter(item => item._id !== id);
    loadedItems--;
    
    // Update UI
    const itemElement = document.getElementById(`item-${id}`);
    if (itemElement) {
      itemElement.remove();
      
      // Check if day is empty
      const dayElement = itemElement.closest('.timeline-day');
      if (dayElement) {
        const items = dayElement.querySelectorAll('.timeline-item');
        if (items.length === 0) {
          dayElement.remove();
        }
      }
    }
    
    // Check if all items are removed
    if (historyItems.length === 0) {
      timeline.innerHTML = `
        <div class="empty-state">
          <p>No history items found</p>
          <button id="refreshButton" class="btn btn-secondary">Refresh</button>
        </div>
      `;
      
      // Re-attach event listener
      document.getElementById('refreshButton').addEventListener('click', () => {
        currentPage = 1;
        loadedItems = 0;
        loadHistory(true);
      });
    }
    
    // Update pagination
    updatePagination();
  } catch (error) {
    console.error('Error deleting history item:', error);
    showError('Failed to delete history item. Please try again later.');
  }
};

/**
 * Clear history
 */
const clearHistory = async () => {
  try {
    // Get filter options
    const options = {};
    
    if (currentDomain) {
      options.domain = currentDomain;
    }
    
    const dateRange = getDateRangeFromFilter(currentDateFilter);
    if (dateRange && dateRange.before) {
      options.before = new Date(dateRange.before);
    }
    
    await api.history.clearUserHistory(options);
    
    // Reset state
    currentPage = 1;
    loadedItems = 0;
    historyItems = [];
    
    // Update UI
    timeline.innerHTML = `
      <div class="empty-state">
        <p>No history items found</p>
        <button id="refreshButton" class="btn btn-secondary">Refresh</button>
      </div>
    `;
    
    // Re-attach event listener
    document.getElementById('refreshButton').addEventListener('click', () => {
      currentPage = 1;
      loadedItems = 0;
      loadHistory(true);
    });
    
    // Update pagination
    totalItems = 0;
    updatePagination();
    
    // Reload domains
    loadDomains();
  } catch (error) {
    console.error('Error clearing history:', error);
    showError('Failed to clear history. Please try again later.');
  }
};

/**
 * Show settings modal
 */
const showSettingsModal = async () => {
  // Load current preferences
  const preferences = await storage.preferences.get();
  
  captureEnabledToggle.checked = preferences.captureEnabled;
  retentionDaysInput.value = preferences.retentionDays;
  showBreadcrumbsToggle.checked = preferences.showBreadcrumbs;
  apiBaseUrlInput.value = preferences.apiBaseUrl || await api.getApiBaseUrl();
  
  settingsModal.style.display = 'block';
};

/**
 * Hide settings modal
 */
const hideSettingsModal = () => {
  settingsModal.style.display = 'none';
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
      alert('Retention days must be between 1 and 365');
      return;
    }
    
    if (!apiBaseUrl) {
      alert('API Base URL is required');
      return;
    }
    
    // Save preferences locally
    await storage.preferences.set({
      captureEnabled,
      retentionDays,
      showBreadcrumbs,
      apiBaseUrl
    });
    
    // Update API base URL
    await api.setApiBaseUrl(apiBaseUrl);
    
    // Save preferences on server
    await api.auth.updatePreferences({
      captureEnabled,
      retentionDays,
      showBreadcrumbs
    });
    
    // Hide modal
    hideSettingsModal();
    
    // Show success message
    alert('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings');
  }
};

/**
 * Show confirmation modal
 * @param {string} message - Confirmation message
 * @param {Function} callback - Callback function
 */
const showConfirmationModal = (message, callback) => {
  confirmationMessage.textContent = message;
  confirmationCallback = callback;
  confirmationModal.style.display = 'block';
};

/**
 * Hide confirmation modal
 */
const hideConfirmationModal = () => {
  confirmationModal.style.display = 'none';
  confirmationCallback = null;
};

/**
 * Toggle dark mode
 */
const toggleDarkMode = async () => {
  const isDarkMode = darkModeToggle.checked;
  
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  // Save preference
  await storage.preferences.set({ darkMode: isDarkMode });
};

/**
 * Show error message
 * @param {string} message - Error message
 */
const showError = (message) => {
  alert(message);
};

// Initialize the timeline
document.addEventListener('DOMContentLoaded', initialize);
