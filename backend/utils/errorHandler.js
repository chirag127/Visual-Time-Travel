/**
 * Error handler utility module
 * Provides consistent error handling throughout the application
 * @module utils/errorHandler
 */

/**
 * Custom API Error class
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
    /**
     * Create an API error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {boolean} isOperational - Whether this is an operational error
     */
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Create a 400 Bad Request error
 * @param {string} message - Error message
 * @returns {ApiError} The created error
 */
const badRequest = (message = "Bad request") => {
    return new ApiError(message, 400);
};

/**
 * Create a 401 Unauthorized error
 * @param {string} message - Error message
 * @returns {ApiError} The created error
 */
const unauthorized = (message = "Unauthorized") => {
    return new ApiError(message, 401);
};

/**
 * Create a 403 Forbidden error
 * @param {string} message - Error message
 * @returns {ApiError} The created error
 */
const forbidden = (message = "Forbidden") => {
    return new ApiError(message, 403);
};

/**
 * Create a 404 Not Found error
 * @param {string} message - Error message
 * @returns {ApiError} The created error
 */
const notFound = (message = "Resource not found") => {
    return new ApiError(message, 404);
};

/**
 * Create a 409 Conflict error
 * @param {string} message - Error message
 * @returns {ApiError} The created error
 */
const conflict = (message = "Conflict") => {
    return new ApiError(message, 409);
};

/**
 * Create a 500 Internal Server Error
 * @param {string} message - Error message
 * @returns {ApiError} The created error
 */
const internal = (message = "Internal server error") => {
    return new ApiError(message, 500, false);
};

/**
 * Handle errors in async functions
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    ApiError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    internal,
    asyncHandler,
};
