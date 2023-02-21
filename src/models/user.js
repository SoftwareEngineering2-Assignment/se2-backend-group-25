// Disable the `func-names` ESLint rule for this file
/* eslint-disable func-names */

// Import the Mongoose library and the Mongoose plugin that converts duplicate errors to validation errors
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

// Import authentication helper functions and validation constants
const { passwordDigest, comparePassword } = require('../utilities/authentication/helpers');
const { constants: { min } } = require('../utilities/validation');

// Turn off Mongoose's default behavior of pluralizing collection names
mongoose.pluralize(null);

// Define a new Mongoose schema for users
const UserSchema = new mongoose.Schema({
  // Define the email field with options for indexing, uniqueness, and requiredness
  email: {
    index: true,
    type: String,
    unique: 'A user already exists with that email!',
    required: [true, 'User email is required'],
    lowercase: true
  },
  // Define the username field with options for indexing, uniqueness, and requiredness
  username: {
    index: true,
    type: String,
    unique: 'A user already exists with that username!',
    required: [true, 'Username is required'],
  },
  // Define the password field with options for selectability, requiredness, and minimum length
  password: {
    type: String,
    required: [true, 'User password is required'],
    select: false,
    minlength: min
  },
  // Define the registrationDate field as a number
  registrationDate: { type: Number }
});

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.
UserSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords and sets the registration date if necessary
UserSchema.pre('save', function (next) {
  // Hash the password if it has been modified
  if (this.isModified('password')) {
    this.password = passwordDigest(this.password);
  }
  // Set the registration date if the email or username has been modified
  if (this.isModified('email') || this.isModified('username')) {
    this.registrationDate = Date.now();
  }
  return next();
});

// Model method that compares hashed passwords
UserSchema.methods.comparePassword = function (password) {
  return comparePassword(password, this.password);
};

// Export the Mongoose model for users
module.exports = mongoose.model('users', UserSchema);
