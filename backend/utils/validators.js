/**
 * Validators utility module
 * Provides input validation functions
 * @module utils/validators
 */

const validator = require('validator');
const { badRequest } = require('./errorHandler');

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} Whether the password is strong enough
 */
const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
const isValidUrl = (url) => {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
};

/**
 * Validate base64 string
 * @param {string} base64 - Base64 string to validate
 * @returns {boolean} Whether the string is valid base64
 */
const isValidBase64 = (base64) => {
  return validator.isBase64(base64);
};

/**
 * Validate signup input
 * @param {Object} data - Signup data
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @throws {ApiError} If validation fails
 */
const validateSignup = (data) => {
  const { email, password } = data;
  
  if (!email || !password) {
    throw badRequest('Email and password are required');
  }
  
  if (!isValidEmail(email)) {
    throw badRequest('Invalid email format');
  }
  
  if (!isStrongPassword(password)) {
    throw badRequest(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    );
  }
};

/**
 * Validate login input
 * @param {Object} data - Login data
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @throws {ApiError} If validation fails
 */
const validateLogin = (data) => {
  const { email, password } = data;
  
  if (!email || !password) {
    throw badRequest('Email and password are required');
  }
  
  if (!isValidEmail(email)) {
    throw badRequest('Invalid email format');
  }
};

/**
 * Validate screenshot upload input
 * @param {Object} data - Screenshot data
 * @param {string} data.imageBase64 - Base64 encoded image
 * @param {string} data.url - URL of the page
 * @param {string} data.title - Title of the page
 * @throws {ApiError} If validation fails
 */
const validateScreenshotUpload = (data) => {
  const { imageBase64, url, title } = data;
  
  if (!imageBase64) {
    throw badRequest('Screenshot image is required');
  }
  
  if (!isValidBase64(imageBase64)) {
    throw badRequest('Invalid image format. Must be base64 encoded');
  }
  
  if (!url) {
    throw badRequest('URL is required');
  }
  
  if (!isValidUrl(url)) {
    throw badRequest('Invalid URL format');
  }
  
  if (!title) {
    throw badRequest('Page title is required');
  }
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  isValidUrl,
  isValidBase64,
  validateSignup,
  validateLogin,
  validateScreenshotUpload
};
