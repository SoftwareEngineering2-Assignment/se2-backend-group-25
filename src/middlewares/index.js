// Importing middlewares from their respective files
const authorization = require('./authorization');
const error = require('./error');
const validation = require('./validation');

// Exporting all the middlewares as an object
module.exports = {
  authorization, // middleware to check for and validate authorization token
  error, // middleware to handle errors
  validation, // middleware to validate incoming requests
};
