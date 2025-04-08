/**
 * Image upload service module
 * Handles uploading images to freeimage.host
 * @module services/imageUploadService
 */

const axios = require('axios');
const FormData = require('form-data');
const env = require('../config/env');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/errorHandler');

/**
 * Upload options
 * @typedef {Object} UploadOptions
 * @property {string} [apiKey] - FreeImage.host API key
 * @property {string} [apiUrl] - FreeImage.host API URL
 * @property {string} [format] - Response format (json, xml)
 * @property {number} [timeout] - Request timeout in milliseconds
 */

/**
 * Default upload options
 * @type {UploadOptions}
 */
const defaultOptions = {
  apiKey: env.FREEIMAGE_API_KEY,
  apiUrl: env.FREEIMAGE_API_URL,
  format: 'json',
  timeout: 10000 // 10 seconds
};

/**
 * Upload an image to freeimage.host
 * @param {string} imageBase64 - Base64 encoded image data (without the data:image/png;base64, prefix)
 * @param {UploadOptions} [options] - Upload options
 * @returns {Promise<string>} URL of the uploaded image
 * @throws {ApiError} If upload fails
 */
const uploadToFreeImageHost = async (imageBase64, options = {}) => {
  // Merge default options with provided options
  const config = { ...defaultOptions, ...options };
  
  // Create form data
  const formData = new FormData();
  formData.append('key', config.apiKey);
  formData.append('source', imageBase64);
  formData.append('action', 'upload');
  formData.append('format', config.format);

  try {
    logger.debug('Uploading image to FreeImage.host');
    
    // Make the request
    const response = await axios.post(config.apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: config.timeout
    });

    // Check if the request was successful
    if (response.status === 200 && response.data && response.data.status_code === 200) {
      logger.debug('Image uploaded successfully');
      return response.data.image.url;
    } else {
      // Handle API error
      const errorMessage = response.data?.status_txt || 'Unknown error';
      logger.error(`FreeImage.host API error: ${errorMessage}`);
      throw new ApiError(`Image upload failed: ${errorMessage}`, 500);
    }
  } catch (error) {
    // Handle network or other errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error uploading image:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error(`FreeImage.host API error: ${error.response.status} - ${error.response.data}`);
      throw new ApiError(`Image upload failed: ${error.response.status} - ${error.response.statusText}`, 500);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('No response received from FreeImage.host API');
      throw new ApiError('Image upload failed: No response from server', 500);
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error(`Error setting up request: ${error.message}`);
      throw new ApiError(`Image upload failed: ${error.message}`, 500);
    }
  }
};

module.exports = {
  uploadToFreeImageHost
};
