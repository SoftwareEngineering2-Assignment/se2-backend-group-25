// Require the mongoose module
const mongoose = require('mongoose');

// Define the options for the mongoose connection
const mongooseOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  poolSize: 100,
  keepAlive: true,
  keepAliveInitialDelay: 300000
};

// Get the MongoDB URI from an environment variable
const mongodbUri = process.env.MONGODB_URI;

// Export a function that connects to the MongoDB database using mongoose
module.exports = () => {
  // Connect to the MongoDB database using mongoose, and catch any errors that occur
  // Disable the eslint console warning for this line
  // because the error is being logged to the console
  // but is not being handled further
  // eslint-disable-next-line no-console
  mongoose.connect(mongodbUri, mongooseOptions).catch(console.error);
};
