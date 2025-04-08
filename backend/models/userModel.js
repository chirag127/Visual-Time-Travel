/**
 * User model module
 * Defines the user schema and model
 * @module models/userModel
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * User schema
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in query results by default
  },
  preferences: {
    captureEnabled: {
      type: Boolean,
      default: true
    },
    retentionDays: {
      type: Number,
      default: 30,
      min: [1, 'Retention period must be at least 1 day'],
      max: [365, 'Retention period cannot exceed 365 days']
    },
    showBreadcrumbs: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Hash the password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare a candidate password with the user's password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} Whether the passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Update user preferences
 * @param {Object} preferences - New preferences
 * @returns {Promise<Object>} Updated user
 */
userSchema.methods.updatePreferences = async function(preferences) {
  // Update only the provided preferences
  if (preferences.captureEnabled !== undefined) {
    this.preferences.captureEnabled = preferences.captureEnabled;
  }
  
  if (preferences.retentionDays !== undefined) {
    this.preferences.retentionDays = preferences.retentionDays;
  }
  
  if (preferences.showBreadcrumbs !== undefined) {
    this.preferences.showBreadcrumbs = preferences.showBreadcrumbs;
  }
  
  this.updatedAt = Date.now();
  return await this.save();
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
