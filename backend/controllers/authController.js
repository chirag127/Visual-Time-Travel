/**
 * Authentication controller module
 * Handles authentication-related requests
 * @module controllers/authController
 */

const authService = require('../services/authService');
const { validateSignup, validateLogin } = require('../utils/validators');
const { asyncHandler } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @route POST /api/auth/signup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User object and token
 */
const signup = asyncHandler(async (req, res) => {
  // Validate input
  validateSignup(req.body);
  
  const { email, password } = req.body;
  
  // Register user
  const result = await authService.registerUser(email, password);
  
  logger.info(`User registered: ${email}`);
  
  // Send response
  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Login a user
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User object and token
 */
const login = asyncHandler(async (req, res) => {
  // Validate input
  validateLogin(req.body);
  
  const { email, password } = req.body;
  
  // Login user
  const result = await authService.loginUser(email, password);
  
  logger.info(`User logged in: ${email}`);
  
  // Send response
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get current user
 * @route GET /api/auth/me
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User object
 */
const getMe = asyncHandler(async (req, res) => {
  // Get user from request (set by auth middleware)
  const userId = req.user.id;
  
  // Get user details
  const user = await authService.getUserById(userId);
  
  // Send response
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * Update user preferences
 * @route PUT /api/auth/preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Updated user object
 */
const updatePreferences = asyncHandler(async (req, res) => {
  // Get user from request (set by auth middleware)
  const userId = req.user.id;
  
  // Get preferences from request body
  const { preferences } = req.body;
  
  // Update preferences
  const result = await authService.updateUserPreferences(userId, preferences);
  
  logger.info(`User preferences updated: ${req.user.email}`);
  
  // Send response
  res.status(200).json({
    success: true,
    data: result
  });
});

module.exports = {
  signup,
  login,
  getMe,
  updatePreferences
};
