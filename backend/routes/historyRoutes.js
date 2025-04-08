/**
 * History routes module
 * Defines history-related routes
 * @module routes/historyRoutes
 */

const express = require('express');
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @route POST /api/history/screenshot
 * @desc Upload a screenshot and add to history
 * @access Private
 */
router.post('/screenshot', historyController.uploadScreenshot);

/**
 * @route GET /api/history
 * @desc Get user history
 * @access Private
 */
router.get('/', historyController.getUserHistory);

/**
 * @route GET /api/history/domains
 * @desc Get user domains
 * @access Private
 */
router.get('/domains', historyController.getUserDomains);

/**
 * @route DELETE /api/history/:id
 * @desc Delete a history item
 * @access Private
 */
router.delete('/:id', historyController.deleteHistoryItem);

/**
 * @route DELETE /api/history
 * @desc Clear user history
 * @access Private
 */
router.delete('/', historyController.clearUserHistory);

module.exports = router;
