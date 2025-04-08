/**
 * Timeline component module
 * Handles timeline UI
 * @module components/timeline
 */

import { getUserHistory, getUserDomains, deleteHistoryItem, clearUserHistory } from '../utils/api.js';

/**
 * Initialize timeline component
 */
export async function initTimelineComponent() {
  // Get elements
  const timelineContainer = document.getElementById('timeline-container');
  const timelineLoading = document.getElementById('timeline-loading');
  const timelineError = document.getElementById('timeline-error');
  const timelineEmpty = document.getElementById('timeline-empty');
  const loadMoreButton = document.getElementById('load-more-button');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const clearSearchButton = document.getElementById('clear-search-button');
  const domainFilterSelect = document.getElementById('domain-filter');
  const clearHistoryButton = document.getElementById('clear-history-button');
  
  // State
  let currentPage = 1;
  let hasNextPage = false;
  let isLoading = false;
  let currentSearch = '';
  let currentDomain = '';
  
  // Add event listeners
  loadMoreButton.addEventListener('click', loadMoreHistory);
  searchButton.addEventListener('click', handleSearch);
  clearSearchButton.addEventListener('click', clearSearch);
  domainFilterSelect.addEventListener('change', handleDomainFilter);
  clearHistoryButton.addEventListener('click', handleClearHistory);
  
  // Load domains for filter
  await loadDomains();
  
  // Load initial history
  await loadHistory();
  
  /**
   * Load user history
   * @param {boolean} [append=false] - Whether to append to existing history
   */
  async function loadHistory(append = false) {
    try {
      // Show loading
      timelineLoading.style.display = 'block';
      timelineError.style.display = 'none';
      
      if (!append) {
        timelineContainer.innerHTML = '';
        timelineEmpty.style.display = 'none';
      }
      
      isLoading = true;
      
      // Get history
      const response = await getUserHistory({
        page: currentPage,
        limit: 10,
        search: currentSearch,
        domain: currentDomain,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      
      // Update pagination state
      hasNextPage = response.data.pagination.hasNextPage;
      
      // Show/hide load more button
      loadMoreButton.style.display = hasNextPage ? 'block' : 'none';
      
      // Get history items
      const historyItems = response.data.items;
      
      // Show empty message if no items
      if (historyItems.length === 0 && !append) {
        timelineEmpty.style.display = 'block';
      }
      
      // Render history items
      historyItems.forEach(item => {
        const historyItem = createHistoryItem(item);
        timelineContainer.appendChild(historyItem);
      });
    } catch (error) {
      // Show error
      timelineError.textContent = error.message || 'Failed to load history';
      timelineError.style.display = 'block';
    } finally {
      // Hide loading
      timelineLoading.style.display = 'none';
      isLoading = false;
    }
  }
  
  /**
   * Load more history
   */
  async function loadMoreHistory() {
    if (isLoading || !hasNextPage) return;
    
    currentPage++;
    await loadHistory(true);
  }
  
  /**
   * Handle search
   */
  async function handleSearch() {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    await loadHistory();
  }
  
  /**
   * Clear search
   */
  async function clearSearch() {
    searchInput.value = '';
    currentSearch = '';
    currentPage = 1;
    await loadHistory();
  }
  
  /**
   * Handle domain filter change
   */
  async function handleDomainFilter() {
    currentDomain = domainFilterSelect.value;
    currentPage = 1;
    await loadHistory();
  }
  
  /**
   * Load domains for filter
   */
  async function loadDomains() {
    try {
      // Get domains
      const response = await getUserDomains();
      
      // Get domains
      const domains = response.data;
      
      // Clear existing options (except the first one)
      while (domainFilterSelect.options.length > 1) {
        domainFilterSelect.remove(1);
      }
      
      // Add domain options
      domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain.domain;
        option.textContent = `${domain.domain} (${domain.count})`;
        domainFilterSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  }
  
  /**
   * Handle clear history
   */
  async function handleClearHistory() {
    if (!confirm('Are you sure you want to clear your history?')) {
      return;
    }
    
    try {
      // Show loading
      timelineLoading.style.display = 'block';
      
      // Clear history
      await clearUserHistory({
        domain: currentDomain
      });
      
      // Reset pagination
      currentPage = 1;
      
      // Reload history
      await loadHistory();
      
      // Reload domains
      await loadDomains();
    } catch (error) {
      // Show error
      timelineError.textContent = error.message || 'Failed to clear history';
      timelineError.style.display = 'block';
    } finally {
      // Hide loading
      timelineLoading.style.display = 'none';
    }
  }
  
  /**
   * Create a history item element
   * @param {Object} item - History item
   * @returns {HTMLElement} History item element
   */
  function createHistoryItem(item) {
    // Create container
    const container = document.createElement('div');
    container.className = 'history-item';
    container.dataset.id = item._id;
    
    // Create screenshot
    const screenshot = document.createElement('div');
    screenshot.className = 'history-item-screenshot';
    
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.title;
    img.loading = 'lazy';
    
    screenshot.appendChild(img);
    
    // Create info
    const info = document.createElement('div');
    info.className = 'history-item-info';
    
    // Create title
    const title = document.createElement('h3');
    title.className = 'history-item-title';
    title.textContent = item.title;
    
    // Create URL
    const url = document.createElement('a');
    url.className = 'history-item-url';
    url.href = item.url;
    url.textContent = item.url;
    url.target = '_blank';
    
    // Create timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'history-item-timestamp';
    timestamp.textContent = new Date(item.timestamp).toLocaleString();
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'history-item-actions';
    
    // Create revisit button
    const revisitButton = document.createElement('button');
    revisitButton.className = 'history-item-revisit';
    revisitButton.textContent = 'Revisit';
    revisitButton.addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
    });
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'history-item-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete this history item?')) {
        return;
      }
      
      try {
        // Delete history item
        await deleteHistoryItem(item._id);
        
        // Remove from DOM
        container.remove();
        
        // Show empty message if no items left
        if (timelineContainer.children.length === 0) {
          timelineEmpty.style.display = 'block';
        }
      } catch (error) {
        console.error('Error deleting history item:', error);
        alert('Failed to delete history item');
      }
    });
    
    // Add buttons to actions
    actions.appendChild(revisitButton);
    actions.appendChild(deleteButton);
    
    // Add elements to info
    info.appendChild(title);
    info.appendChild(url);
    info.appendChild(timestamp);
    info.appendChild(actions);
    
    // Add elements to container
    container.appendChild(screenshot);
    container.appendChild(info);
    
    return container;
  }
}
