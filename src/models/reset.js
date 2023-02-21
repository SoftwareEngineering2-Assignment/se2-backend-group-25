/* eslint-disable func-names */

const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

// Destructure the "expires" constant from the "validation" utility
const { constants: { expires } } = require('../utilities/validation');

// Define a new Mongoose schema for password reset tokens
const ResetSchema = new mongoose.Schema({
  // Username associated with the reset token
  username: {
    index: true,        // Create an index on this field for faster lookups
    type: String,
    required: true,     // This field is required
    unique: 'A token already exists for that username!',   // Ensure uniqueness of the token
    lowercase: true     // Convert the value to lowercase
  },
  // The actual reset token
  token: {
    type: String,
    required: true      // This field is required
  },
  // The expiration date of the token
  expireAt: {
    type: Date,
    default: Date.now,  // Default value is the current date and time
    index: { expires }  // Automatically expire tokens based on this field
  },
});

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors
ResetSchema.plugin(beautifyUnique);

// Disable automatic pluralization of the collection name
mongoose.pluralize(null);

// Export the Mongoose model for the reset token schema
module.exports = mongoose.model('reset-tokens', ResetSchema);
