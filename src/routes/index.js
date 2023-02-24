// Import the required dependencies and routers
const express = require('express');
const users = require('./users');
const sources = require('./sources');
const dashboards = require('./dashboards');
const general = require('./general');
const root = require('./root');

// Create a new router instance
const router = express.Router();

// Set up the routes for each of the sub-routers
router.use('/users', users);
router.use('/sources', sources);
router.use('/dashboards', dashboards);
router.use('/general', general);
router.use('/', root);

// Export the router for use in other modules
module.exports = router;

// This file sets up the main router for the application, and delegates requests to the appropriate sub-routers based on the requested URL. 
// The sub-routers are defined in separate modules for each set of related routes (e.g. user routes, source routes, etc.), 
// and are mounted on the main router using the router.use() method.
