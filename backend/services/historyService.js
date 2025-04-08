/**
 * History service module
 * Handles history operations
 * @module services/historyService
 */

const mongoose = require("mongoose");
const History = require("../models/historyModel");
const User = require("../models/userModel");
const { uploadToFreeImageHost } = require("./imageUploadService");
const { notFound, badRequest } = require("../utils/errorHandler");

/**
 * Add a history item
 * @param {string} userId - User ID
 * @param {Object} data - History item data
 * @param {string} data.imageBase64 - Base64 encoded screenshot
 * @param {string} data.url - Page URL
 * @param {string} data.title - Page title
 * @param {string} [data.favicon] - Page favicon URL
 * @returns {Promise<Object>} Created history item
 * @throws {ApiError} If creation fails
 */
const addHistoryItem = async (userId, data) => {
    try {
        const { imageBase64, url, title, favicon } = data;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw notFound("User not found");
        }

        // Check if screenshot capture is enabled for this user
        if (!user.preferences.captureEnabled) {
            console.debug(`Screenshot capture disabled for user ${userId}`);
            return { message: "Screenshot capture is disabled" };
        }

        // Upload image to FreeImage.host
        const imageUrl = await uploadToFreeImageHost(imageBase64);

        // Extract domain from URL
        const domain = new URL(url).hostname;

        // Create history item
        const historyItem = await History.create({
            userId,
            url,
            title,
            imageUrl,
            favicon,
            domain,
            timestamp: new Date(),
        });

        // Clean up old history items based on user preferences
        const { retentionDays } = user.preferences;
        if (retentionDays > 0) {
            // Run cleanup in the background
            History.deleteOlderThan(userId, retentionDays)
                .then((result) => {
                    console.debug(
                        `Deleted ${result.deletedCount} old history items for user ${userId}`
                    );
                })
                .catch((error) => {
                    console.error(
                        `Error cleaning up old history items: ${error.message}`
                    );
                });
        }

        return historyItem;
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error adding history item:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("User not found");
        }

        // Handle validation errors
        if (error.name === "ValidationError") {
            throw badRequest(error.message);
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Get user history
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} [options.limit=50] - Maximum number of items to return
 * @param {number} [options.page=1] - Page number
 * @param {string} [options.domain] - Filter by domain
 * @param {string} [options.search] - Search keyword
 * @param {string} [options.sortBy='timestamp'] - Sort field
 * @param {string} [options.sortOrder='desc'] - Sort order
 * @returns {Promise<Object>} History items and pagination info
 * @throws {ApiError} If retrieval fails
 */
const getUserHistory = async (userId, options = {}) => {
    try {
        // Set default options
        const limit = parseInt(options.limit) || 50;
        const page = parseInt(options.page) || 1;
        const skip = (page - 1) * limit;
        const domain = options.domain;
        const search = options.search;
        const sortBy = options.sortBy || "timestamp";
        const sortOrder = options.sortOrder === "asc" ? 1 : -1;

        // Build sort object
        const sort = { [sortBy]: sortOrder };

        // Build query
        let query = { userId };

        // Add domain filter if provided
        if (domain) {
            query.domain = domain;
        }

        // Add search filter if provided
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { url: { $regex: search, $options: "i" } },
            ];
        }

        // Get total count
        const total = await History.countDocuments(query);

        // Get history items
        const historyItems = await History.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            items: historyItems,
            pagination: {
                total,
                limit,
                page,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
        };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error getting user history:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("User not found");
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Get domains for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of domains with counts
 * @throws {ApiError} If retrieval fails
 */
const getUserDomains = async (userId) => {
    try {
        // Aggregate domains with counts
        const domains = await History.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: "$domain", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { domain: "$_id", count: 1, _id: 0 } },
        ]);

        console.debug(`Found ${domains.length} domains for user ${userId}`);

        return domains;
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error getting user domains:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("User not found");
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Delete a history item
 * @param {string} userId - User ID
 * @param {string} historyItemId - History item ID
 * @returns {Promise<Object>} Deletion result
 * @throws {ApiError} If deletion fails
 */
const deleteHistoryItem = async (userId, historyItemId) => {
    try {
        // Find and delete the history item
        const result = await History.findOneAndDelete({
            _id: historyItemId,
            userId,
        });

        if (!result) {
            throw notFound("History item not found");
        }

        return { message: "History item deleted successfully" };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error deleting history item:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("History item not found");
        }

        // Rethrow the error
        throw error;
    }
};

/**
 * Clear user history
 * @param {string} userId - User ID
 * @param {Object} options - Clear options
 * @param {string} [options.domain] - Clear only items from this domain
 * @param {Date} [options.before] - Clear only items before this date
 * @returns {Promise<Object>} Deletion result
 * @throws {ApiError} If deletion fails
 */
const clearUserHistory = async (userId, options = {}) => {
    try {
        // Build query
        const query = { userId };

        // Add domain filter if provided
        if (options.domain) {
            query.domain = options.domain;
        }

        // Add date filter if provided
        if (options.before) {
            query.timestamp = { $lt: options.before };
        }

        // Delete matching history items
        const result = await History.deleteMany(query);

        return {
            message: `${result.deletedCount} history items deleted successfully`,
        };
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error.statusCode) {
            throw error;
        }

        // Log the error
        console.error("Error clearing user history:", error);

        // Handle invalid ObjectId
        if (error.name === "CastError") {
            throw notFound("User not found");
        }

        // Rethrow the error
        throw error;
    }
};

module.exports = {
    addHistoryItem,
    getUserHistory,
    getUserDomains,
    deleteHistoryItem,
    clearUserHistory,
};
