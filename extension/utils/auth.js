/**
 * Authentication utility module
 * Handles authentication in the extension
 * @module utils/auth
 */

import { getStorageItem, setStorageItem, removeStorageItem } from './storage.js';

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Get authentication token
 * @returns {Promise<string|null>} Authentication token or null if not logged in
 */
export async function getAuthToken() {
  return await getStorageItem(TOKEN_KEY);
}

/**
 * Get current user
 * @returns {Promise<Object|null>} User object or null if not logged in
 */
export async function getCurrentUser() {
  return await getStorageItem(USER_KEY);
}

/**
 * Check if user is logged in
 * @returns {Promise<boolean>} Whether user is logged in
 */
export async function isLoggedIn() {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Save authentication data
 * @param {Object} data - Authentication data
 * @param {string} data.token - Authentication token
 * @param {Object} data.user - User object
 * @returns {Promise<void>}
 */
export async function saveAuth(data) {
  const { token, user } = data;
  
  await Promise.all([
    setStorageItem(TOKEN_KEY, token),
    setStorageItem(USER_KEY, user)
  ]);
}

/**
 * Clear authentication data
 * @returns {Promise<void>}
 */
export async function clearAuth() {
  await Promise.all([
    removeStorageItem(TOKEN_KEY),
    removeStorageItem(USER_KEY)
  ]);
}

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} Whether token is expired
 */
export function isTokenExpired(token) {
  const payload = parseJwt(token);
  
  if (!payload || !payload.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}
