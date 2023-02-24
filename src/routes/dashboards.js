/* eslint-disable max-len */ // Disable the max line length warning in the linter

// Require the necessary packages and middlewares
const express = require('express');
const mongoose = require('mongoose');
const {authorization} = require('../middlewares');

const router = express.Router(); // Create an instance of the express router

// Require the necessary models
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

// Define an endpoint for getting all dashboards
router.get('/dashboards',
  authorization, // Use the authorization middleware to ensure the user is authenticated
  async (req, res, next) => {
    try {
      const {id} = req.decoded; // Get the user ID from the decoded token in the request object
      const foundDashboards = await Dashboard.find({owner: mongoose.Types.ObjectId(id)}); // Find all dashboards that belong to the user
      const dashboards = [];
      foundDashboards.forEach((s) => { // Format the found dashboards
        dashboards.push({
          id: s._id,
          name: s.name,
          views: s.views
        });
      });

      return res.json({ // Send the formatted dashboards as a response
        success: true,
        dashboards
      });
    } catch (err) {
      return next(err.body); // Forward any errors to the error handling middleware
    }
  });

// Define an endpoint for creating a new dashboard
router.post('/create-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {name} = req.body; // Get the name of the new dashboard from the request body
      const {id} = req.decoded; // Get the user ID from the decoded token in the request object
      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(id), name}); // Check if a dashboard with the given name already exists for the user
      if (foundDashboard) { // If a dashboard with the given name already exists, send an error response
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.'
        });
      }
      await new Dashboard({ // Otherwise, create the new dashboard and save it to the database
        name,
        layout: [],
        items: {},
        nextId: 1,
        owner: mongoose.Types.ObjectId(id)
      }).save();

      return res.json({success: true}); // Send a success response
    } catch (err) {
      return next(err.body); // Forward any errors to the error handling middleware
    }
  }); 

// Define an endpoint for deleting a dashboard
router.post('/delete-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body; // Get the ID of the dashboard to delete from the request body

      const foundDashboard = await Dashboard.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)}); // Find and remove the dashboard from the database
      if (!foundDashboard) { // If the dashboard was not found, send an error response
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }
      return res.json({success: true}); // Send a success response
    } catch (err) {
      return next(err.body); // Forward any errors to the error handling middleware
    }
  }); 

// Define an endpoint for getting a single dashboard and its associated sources
router.get('/dashboard',
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.query;

      // Find the dashboard with the given id, that belongs to the currently logged-in user
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});

      // If no dashboard was found, return an error message
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }

      // If a dashboard was found, extract its properties and send them to the client along with a list of sources
      const dashboard = {};
      dashboard.id = foundDashboard._id;
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;
      dashboard.nextId = foundDashboard.nextId;

      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(req.decoded.id)});
      const sources = [];
      foundSources.forEach((s) => {
        sources.push(s.name);
      });
    
      return res.json({
        success: true,
        dashboard,
        sources
      });
    } catch (err) {
      return next(err.body);
    }
  });

router.post('/save-dashboard', 
  authorization,
  async (req, res, next) => {
    try {
      const {id, layout, items, nextId} = req.body;

      // Update the specified dashboard with the given layout, items, and nextId
      const result = await Dashboard.findOneAndUpdate({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)}, {
        $set: {
          layout,
          items,
          nextId
        }
      }, {new: true});

      // If no dashboard was found to update, return an error message
      if (result === null) {
        return res.json({
          status: 409,
          message: 'The selected dashboard has not been found.'
        });
      }

      // If the dashboard was updated successfully, send a success message to the client
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  });


router.post('/clone-dashboard', 
  authorization, // middleware for checking if the user is authorized
  async (req, res, next) => { // handles the POST request to clone a dashboard
    try {
      const {dashboardId, name} = req.body; // destructure the dashboard ID and name from the request body

      const foundDashboard = await Dashboard.findOne({owner: mongoose.Types.ObjectId(req.decoded.id), name}); // check if a dashboard with the same name already exists
      if (foundDashboard) { // if the dashboard with the same name is found
        return res.json({
          status: 409,
          message: 'A dashboard with that name already exists.' // return a response indicating that a dashboard with the same name already exists
        });
      }

      const oldDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(req.decoded.id)}); // find the dashboard to clone
      
      await new Dashboard({ // create a new dashboard instance with the old dashboard's properties
        name,
        layout: oldDashboard.layout,
        items: oldDashboard.items,
        nextId: oldDashboard.nextId,
        owner: mongoose.Types.ObjectId(req.decoded.id) // set the owner to the current user
      }).save();

      return res.json({success: true}); // return a success response if the dashboard was cloned successfully
    } catch (err) {
      return next(err.body); // pass the error to the next middleware function
    }
  }); 

router.post('/check-password-needed', 
  async (req, res, next) => {
    try {
      const {user, dashboardId} = req.body;
      const userId = user.id;

      // Find the dashboard by ID and select its password field (which is normally hidden)
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }

      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;

      // Check if the user is the owner of the dashboard
      if (userId && foundDashboard.owner.equals(userId)) {
        // If so, increment the dashboard's views count and return the dashboard data
        foundDashboard.views += 1;
        await foundDashboard.save();

        return res.json({
          success: true,
          owner: 'self',
          shared: foundDashboard.shared,
          hasPassword: foundDashboard.password !== null,
          dashboard
        });
      } 
      // If the dashboard is not shared, return that information
      if (!(foundDashboard.shared)) {
        return res.json({
          success: true,
          owner: '',
          shared: false
        });
      }
      // If the dashboard is shared and has no password, increment the views count and return the dashboard data
      if (foundDashboard.password === null) {
        foundDashboard.views += 1;
        await foundDashboard.save();

        return res.json({
          success: true,
          owner: foundDashboard.owner,
          shared: true,
          passwordNeeded: false,
          dashboard
        });
      }
      // If the dashboard is shared and has a password, return that information
      return res.json({
        success: true,
        owner: '',
        shared: true,
        passwordNeeded: true
      });
    } catch (err) {
      return next(err.body);
    }
  }); 

//This is a route for checking the password of a shared dashboard
router.post('/check-password', 
  async (req, res, next) => {
    try {
      const {dashboardId, password} = req.body;
      
      // Find the dashboard by ID and retrieve the password, if there is one.
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId)}).select('+password');
      
      // If the dashboard does not exist, return an error response.
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }
      
      // If the password provided by the user does not match the dashboard's password, 
      // return a successful response with a flag indicating that the password is incorrect.
      if (!foundDashboard.comparePassword(password, foundDashboard.password)) {
        return res.json({
          success: true,
          correctPassword: false
        });
      }

      // If the password is correct, increment the number of views for the dashboard and save it.
      foundDashboard.views += 1;
      await foundDashboard.save();
      
      // Prepare the dashboard data to be sent in the response.
      const dashboard = {};
      dashboard.name = foundDashboard.name;
      dashboard.layout = foundDashboard.layout;
      dashboard.items = foundDashboard.items;

      // Return a successful response with a flag indicating that the password is correct,
      // as well as the owner of the dashboard and the dashboard data.
      return res.json({
        success: true,
        correctPassword: true,
        owner: foundDashboard.owner,
        dashboard
      });
    } catch (err) {
      // If an error occurs, call the next middleware function with the error as a parameter.
      return next(err.body);
    }
  });  

// This endpoint allows the user to share a dashboard they own.
router.post('/share-dashboard', 
  authorization, // Middleware function to verify the user's authorization
  async (req, res, next) => {
    try {
      const {dashboardId} = req.body;
      const {id} = req.decoded;

      // Find the dashboard with the given ID that belongs to the user.
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }

      // Toggle the shared status of the dashboard and save it to the database.
      foundDashboard.shared = !(foundDashboard.shared);
      await foundDashboard.save();

      return res.json({
        success: true,
        shared: foundDashboard.shared
      });
    } catch (err) {
      return next(err.body);
    }
  }); 

// This endpoint allows the user to change the password of a dashboard they own.
router.post('/change-password', 
  authorization, // Middleware function to verify the user's authorization
  async (req, res, next) => {
    try {
      const {dashboardId, password} = req.body;
      const {id} = req.decoded;

      // Find the dashboard with the given ID that belongs to the user.
      const foundDashboard = await Dashboard.findOne({_id: mongoose.Types.ObjectId(dashboardId), owner: mongoose.Types.ObjectId(id)});
      if (!foundDashboard) {
        return res.json({
          status: 409,
          message: 'The specified dashboard has not been found.'
        });
      }

      // Update the password of the dashboard and save it to the database.
      foundDashboard.password = password;
      await foundDashboard.save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

module.exports = router; // Export the router for use in other parts of the application.
