/**
 * Authentication service module
 * Handles user authentication logic
 * @module services/authService
 */

const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const env = require("../config/env");
const { unauthorized, notFound, conflict } = require("../utils/errorHandler");

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
};

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and token
 * @throws {ApiError} If registration fails
 */
const registerUser = async (email, password) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw conflict("User with this email already exists");
        }

        // Create new user
        const user = await User.create({
            email,
            password,
        });

        // Generate token
        const token = generateToken(user);

        // Return user data (without password) and token
        return {
            user: {
                id: user._id,
                email: user.email,
                preferences: user.preferences,
                createdAt: user.createdAt,
            },
            token,
        };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error registering user:", error);

        // Handle duplicate key error from MongoDB
        if (error.code === 11000) {
            throw conflict("User with this email already exists");
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and token
 * @throws {ApiError} If login fails
 */
const loginUser = async (email, password) => {
    try {
        // Find user by email and include the password field
        const user = await User.findOne({ email }).select("+password");

        // Check if user exists
        if (!user) {
            throw unauthorized("Invalid email or password");
        }

        // Check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            throw unauthorized("Invalid email or password");
        }

        // Generate token
        const token = generateToken(user);

        // Return user data (without password) and token
        return {
            user: {
                id: user._id,
                email: user.email,
                preferences: user.preferences,
                createdAt: user.createdAt,
            },
            token,
        };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error logging in user:", error);

        // Rethrow the error
        throw error;
    }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 * @throws {ApiError} If user not found
 */
const getUserById = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw notFound("User not found");
        }

        return {
            id: user._id,
            email: user.email,
            preferences: user.preferences,
            createdAt: user.createdAt,
        };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error getting user by ID:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("User not found");
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} Updated user object
 * @throws {ApiError} If update fails
 */
const updateUserPreferences = async (userId, preferences) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw notFound("User not found");
        }

        // Update preferences
        await user.updatePreferences(preferences);

        return {
            id: user._id,
            email: user.email,
            preferences: user.preferences,
            updatedAt: user.updatedAt,
        };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error updating user preferences:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("User not found");
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token payload
 * @throws {ApiError} If token is invalid
 */
const verifyToken = (token) => {
    try {
        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error("Error verifying token:", error);
        throw unauthorized("Invalid or expired token");
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    updateUserPreferences,
    verifyToken,
    generateToken,
};
