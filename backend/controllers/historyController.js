/**
 * History controller module
 * Handles history-related requests
 * @module controllers/historyController
 */

const historyService = require("../services/historyService");
const { validateScreenshotUpload } = require("../utils/validators");
const { asyncHandler } = require("../utils/errorHandler");

/**
 * Upload a screenshot and add to history
 * @route POST /api/history/screenshot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Created history item
 */
const uploadScreenshot = asyncHandler(async (req, res) => {
    // Validate input
    validateScreenshotUpload(req.body);

    // Get user from request (set by auth middleware)
    const userId = req.user.id;

    // Get data from request body
    const { imageBase64, url, title, favicon } = req.body;

    // Add history item
    const result = await historyService.addHistoryItem(userId, {
        imageBase64,
        url,
        title,
        favicon,
    });

    console.log(`Screenshot uploaded for URL: ${url}`);

    // Send response
    res.status(201).json({
        success: true,
        data: result,
    });
});

/**
 * Get user history
 * @route GET /api/history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} History items and pagination info
 */
const getUserHistory = asyncHandler(async (req, res) => {
    // Get user from request (set by auth middleware)
    const userId = req.user.id;

    // Get query parameters
    const { limit, page, domain, search, sortBy, sortOrder } = req.query;

    // Get history
    const result = await historyService.getUserHistory(userId, {
        limit,
        page,
        domain,
        search,
        sortBy,
        sortOrder,
    });

    // Send response
    res.status(200).json({
        success: true,
        data: result,
    });
});

/**
 * Get user domains
 * @route GET /api/history/domains
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} List of domains with counts
 */
const getUserDomains = asyncHandler(async (req, res) => {
    // Get user from request (set by auth middleware)
    const userId = req.user.id;

    // Get domains
    const domains = await historyService.getUserDomains(userId);

    // Send response
    res.status(200).json({
        success: true,
        data: domains,
    });
});

/**
 * Delete a history item
 * @route DELETE /api/history/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Deletion result
 */
const deleteHistoryItem = asyncHandler(async (req, res) => {
    // Get user from request (set by auth middleware)
    const userId = req.user.id;

    // Get history item ID from request parameters
    const historyItemId = req.params.id;

    // Delete history item
    const result = await historyService.deleteHistoryItem(
        userId,
        historyItemId
    );

    console.log(`History item deleted: ${historyItemId}`);

    // Send response
    res.status(200).json({
        success: true,
        data: result,
    });
});

/**
 * Clear user history
 * @route DELETE /api/history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Deletion result
 */
const clearUserHistory = asyncHandler(async (req, res) => {
    // Get user from request (set by auth middleware)
    const userId = req.user.id;

    // Get query parameters
    const { domain, before } = req.query;

    // Parse before date if provided
    const beforeDate = before ? new Date(before) : null;

    // Clear history
    const result = await historyService.clearUserHistory(userId, {
        domain,
        before: beforeDate,
    });

    console.log(`History cleared for user: ${req.user.email}`);

    // Send response
    res.status(200).json({
        success: true,
        data: result,
    });
});

module.exports = {
    uploadScreenshot,
    getUserHistory,
    getUserDomains,
    deleteHistoryItem,
    clearUserHistory,
};
