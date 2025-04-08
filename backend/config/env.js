/**
 * Environment configuration module
 * Centralizes all environment variables and provides defaults
 * @module config/env
 */

// Load environment variables from .env file
require('dotenv').config();

/**
 * Environment configuration object
 * @type {Object}
 */
const env = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  MONGODB_URI: process.env.NODE_ENV === 'production' 
    ? process.env.MONGODB_URI_PROD 
    : process.env.MONGODB_URI || 'mongodb://localhost:27017/visual-time-travel',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'visual_time_travel_jwt_secret_key_dev',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  
  // FreeImage.host API
  FREEIMAGE_API_KEY: process.env.FREEIMAGE_API_KEY || '6d207e02198a847aa98d0a2a901485a5',
  FREEIMAGE_API_URL: process.env.FREEIMAGE_API_URL || 'https://freeimage.host/api/1/upload',
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window
  
  // Determine if we're in production
  isProduction: process.env.NODE_ENV === 'production',
  
  // Determine if we're in development
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  
  // Determine if we're in test
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = env;
