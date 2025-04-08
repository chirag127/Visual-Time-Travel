/**
 * Authentication middleware module
 * Handles JWT authentication for protected routes
 * @module middleware/authMiddleware
 */

const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/errorHandler');
const User = require('../models/userModel');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Protect routes - Verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return next(unauthorized('Not authorized to access this route'));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(unauthorized('User no longer exists'));
      }
      
      // Attach user to request
      req.user = {
        id: user._id,
        email: user.email
      };
      
      next();
    } catch (error) {
      logger.error('Error verifying token:', error);
      return next(unauthorized('Not authorized to access this route'));
    }
  } catch (error) {
    logger.error('Error in auth middleware:', error);
    return next(error);
  }
};

module.exports = { protect };
