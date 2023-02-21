// This file exports a single object with the mongoose instance for the entire app.

// Require the mongoose module
const mongoose = require('./mongoose');

// Export the mongoose object as a property of the module.exports object
module.exports = { mongoose };
