/**
 * Error middleware module
 * Handles error responses for the API
 * @module middleware/errorMiddleware
 */

const { ApiError } = require("../utils/errorHandler");
const env = require("../config/env");

/**
 * Not found middleware - Handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const notFound = (req, res, next) => {
    const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};

/**
 * Error handler middleware - Handle all errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const errorHandler = (err, req, res, next) => {
    // Set default status code and message
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong";

    // Log the error
    console.error(`Error: ${statusCode} - ${message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
        statusCode = 409;
        message = "Duplicate field value entered";
    }

    // Handle Mongoose cast errors
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        stack: env.isDevelopment ? err.stack : undefined,
    });
};

module.exports = {
    notFound,
    errorHandler,
};
