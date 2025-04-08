/**
 * History model module
 * Defines the history schema and model
 * @module models/historyModel
 */

const mongoose = require('mongoose');
const validator = require('validator');

/**
 * History schema
 * @type {mongoose.Schema}
 */
const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    validate: {
      validator: function(v) {
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true
        });
      },
      message: props => `${props.value} is not a valid URL`
    }
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    validate: {
      validator: function(v) {
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true
        });
      },
      message: props => `${props.value} is not a valid image URL`
    }
  },
  favicon: {
    type: String,
    validate: {
      validator: function(v) {
        // Allow empty favicon
        if (!v) return true;
        
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true
        });
      },
      message: props => `${props.value} is not a valid favicon URL`
    }
  },
  domain: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Add indexes for efficient querying
  indexes: [
    { userId: 1, timestamp: -1 }, // For getting user's history sorted by time
    { userId: 1, domain: 1 },     // For filtering by domain
    { userId: 1, url: 1 }         // For checking if a URL already exists
  ]
});

/**
 * Extract domain from URL before saving
 */
historySchema.pre('save', function(next) {
  try {
    // Extract domain from URL if not already set
    if (!this.domain) {
      const url = new URL(this.url);
      this.domain = url.hostname;
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Find history items by domain
 * @param {string} userId - User ID
 * @param {string} domain - Domain to filter by
 * @param {Object} options - Query options
 * @returns {Promise<Array>} History items
 */
historySchema.statics.findByDomain = async function(userId, domain, options = {}) {
  const { limit = 50, skip = 0, sort = { timestamp: -1 } } = options;
  
  return this.find({
    userId,
    domain
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Search history items by keyword
 * @param {string} userId - User ID
 * @param {string} keyword - Keyword to search for
 * @param {Object} options - Query options
 * @returns {Promise<Array>} History items
 */
historySchema.statics.searchByKeyword = async function(userId, keyword, options = {}) {
  const { limit = 50, skip = 0, sort = { timestamp: -1 } } = options;
  
  return this.find({
    userId,
    $or: [
      { title: { $regex: keyword, $options: 'i' } },
      { url: { $regex: keyword, $options: 'i' } }
    ]
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Delete history items older than specified days
 * @param {string} userId - User ID
 * @param {number} days - Number of days to keep
 * @returns {Promise<Object>} Deletion result
 */
historySchema.statics.deleteOlderThan = async function(userId, days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  return this.deleteMany({
    userId,
    timestamp: { $lt: date }
  });
};

// Create the History model
const History = mongoose.model('History', historySchema);

module.exports = History;
