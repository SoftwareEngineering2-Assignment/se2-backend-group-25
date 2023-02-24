// Import required modules
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../', '.env')});
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const {error} = require('./middlewares');
const routes = require('./routes');
const {mongoose} = require('./config');

// Create express application
const app = express();

// Allow Cross-origin resource sharing
app.use(cors());

// Enhance security with Helmet middleware
app.use(helmet());

// Use compression middleware to reduce response size
app.use(compression());

// Use logger middleware for development environment only
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}

// Parse JSON body with body-parser middleware
app.use(bodyParser.json({limit: '50mb'}));

// Parse urlencoded form data with body-parser middleware
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

// Connect to MongoDB using mongoose
mongoose();

// Define routes for the application
app.use('/', routes);

// Serve static files from the assets folder
app.use(express.static(path.join(__dirname, 'assets')));

// Define error handling middleware
app.use(error);

// Start the server and listen to incoming requests
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`NodeJS Server listening on port ${port}. \nMode: ${process.env.NODE_ENV}`));

// Export the application for testing purposes
module.exports = app;

