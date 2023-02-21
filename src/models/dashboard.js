/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');
const {passwordDigest, comparePassword} = require('../utilities/authentication/helpers');

mongoose.pluralize(null);

// Create a new Mongoose schema for the Dashboard model
const DashboardSchema = new mongoose.Schema(
  {
    name: {
      index: true, // Create an index on the "name" field for faster lookups
      type: String,
      required: [true, 'Dashboard name is required'] // Ensure that the "name" field is required
    },
    layout: {
      type: Array,
      default: [] // Set a default value for the "layout" field
    },
    items: {
      type: Object,
      default: {} // Set a default value for the "items" field
    },
    nextId: {
      type: Number,
      min: 1,
      default: 1 // Set a default value for the "nextId" field
    },
    password: {
      type: String,
      select: false, // Don't include this field when querying the database
      default: null // Set a default value for the "password" field
    },
    shared: {
      type: Boolean,
      default: false // Set a default value for the "shared" field
    },
    views: {
      type: Number,
      default: 0,
      min: 0 // Ensure that the "views" field is at least 0
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Create a reference to the User model
    },
    createdAt: {type: Date} // Create a new field for the creation date of the dashboard
  }
);

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.
DashboardSchema.plugin(beautifyUnique);

// Pre save hook that hashes passwords
DashboardSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    // If the password has been modified, hash it using the passwordDigest function from the authentication helpers
    this.password = passwordDigest(this.password);
  }
  if (this.isModified('name')) {
    // If the name has been modified, set the creation date to the current date
    this.createdAt = Date.now();
  }
  return next();
});

// Model method that compares hashed passwords
DashboardSchema.methods.comparePassword = function (password) {
  // Define a method on the Dashboard model that can be used to compare a plain-text password with the hashed password stored in the database
  return comparePassword(password, this.password);
};

// Export the Dashboard model
module.exports = mongoose.model('dashboards', DashboardSchema);
