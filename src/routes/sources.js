/* eslint-disable max-len */ // Disables the max length linter rule for this file
const express = require('express'); // Imports the express library
const mongoose = require('mongoose'); // Imports the mongoose library
const {authorization} = require('../middlewares'); // Imports the authorization middleware

const router = express.Router(); // Creates an instance of the Express router

const Source = require('../models/source'); // Imports the Source model

router.get('/sources',
  authorization, // Middleware that ensures the user is authorized to access the resource
  async (req, res, next) => { // Async route handler for GET /sources endpoint
    try {
      const {id} = req.decoded; // Extracts the user ID from the decoded JWT token
      const foundSources = await Source.find({owner: mongoose.Types.ObjectId(id)}); // Finds all sources that belong to the user
      const sources = []; // Initializes an empty array for the transformed sources
      
      // Transforms each source object into a simplified object that only contains specific properties
      foundSources.forEach((s) => {
        sources.push({
          id: s._id,
          name: s.name,
          type: s.type,
          url: s.url,
          login: s.login,
          passcode: s.passcode,
          vhost: s.vhost,
          active: false // Sets the active property to false for now
        });
      });

      return res.json({
        success: true,
        sources
      }); // Returns the sources in the response
    } catch (err) {
      return next(err.body); // Passes any errors to the error handler
    }
  });

// Handle HTTP POST requests to create a new data source
router.post('/create-source', 
  authorization, // Use authorization middleware to ensure user is authenticated
  async (req, res, next) => {
    try {
      // Get data for new source from request body
      const {name, type, url, login, passcode, vhost} = req.body;
      const {id} = req.decoded; // Get user id from JWT token
      const foundSource = await Source.findOne({owner: mongoose.Types.ObjectId(id), name}); // Check if source with the given name already exists for the user
      if (foundSource) { // If source already exists, return error message
        return res.json({
          status: 409,
          message: 'A source with that name already exists.'
        });
      }
      // Create new source object and save it to the database
      await new Source({
        name,
        type,
        url,
        login,
        passcode,
        vhost,
        owner: mongoose.Types.ObjectId(id)
      }).save();

      // Return success message
      return res.json({success: true});
    } catch (err) {
      // If an error occurs, pass it to the error handler middleware
      return next(err.body);
    }
  });

//This is a route for updating an existing source in the database.
router.post('/change-source',
  authorization,
  async (req, res, next) => {
    try {
      const {id, name, type, url, login, passcode, vhost} = req.body;

      // Find the source by id and check if it belongs to the authenticated user
      const foundSource = await Source.findOne({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }

      // Check if a source with the same name already exists for the authenticated user
      const sameNameSources = await Source.findOne({_id: {$ne: mongoose.Types.ObjectId(id)}, owner: mongoose.Types.ObjectId(req.decoded.id), name});
      if (sameNameSources) {
        return res.json({
          status: 409,
          message: 'A source with the same name has been found.'
        });
      }

      // Update the found source with the new data
      foundSource.name = name;
      foundSource.type = type;
      foundSource.url = url;
      foundSource.login = login;
      foundSource.passcode = passcode;
      foundSource.vhost = vhost;
      await foundSource.save();

      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  });

/*
This route is used to delete a source.
It is using the authorization middleware to ensure that only authorized users can access this route.
It is an HTTP POST route that expects the source ID in the request body.
Inside a try block, it attempts to find the source with the provided ID and the owner ID from the decoded JWT.
If the source is not found, it returns a JSON response indicating that the selected source has not been found.
If the source is found, it is removed from the database using the findOneAndRemove() method and a JSON response is returned indicating that the deletion was successful.
*/
router.post('/delete-source', 
  authorization,
  async (req, res, next) => {
    try {
      const {id} = req.body;

      const foundSource = await Source.findOneAndRemove({_id: mongoose.Types.ObjectId(id), owner: mongoose.Types.ObjectId(req.decoded.id)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }
      return res.json({success: true});
    } catch (err) {
      return next(err.body);
    }
  }); 

/*
This route is used to get a source by its name and owner ID.
It is an HTTP POST route that expects the source name, owner ID, and user object in the request body.
Inside a try block, it checks whether the owner ID is equal to 'self' and sets the user ID accordingly, or whether it is the actual owner ID provided in the request body.
Then it attempts to find a source with the provided name and owner ID.
If the source is not found, it returns a JSON response indicating that the selected source has not been found.
If the source is found, it creates a source object with some of the source's properties and returns a JSON response containing the source object and a success property with a value of true.
*/
router.post('/source',
  async (req, res, next) => {
    try {
      const {name, owner, user} = req.body;
      const userId = (owner === 'self') ? user.id : owner;
      const foundSource = await Source.findOne({name, owner: mongoose.Types.ObjectId(userId)});
      if (!foundSource) {
        return res.json({
          status: 409,
          message: 'The selected source has not been found.'
        });
      }

      const source = {};
      source.type = foundSource.type;
      source.url = foundSource.url;
      source.login = foundSource.login;
      source.passcode = foundSource.passcode;
      source.vhost = foundSource.vhost;
    
      return res.json({
        success: true,
        source
      });
    } catch (err) {
      return next(err.body);
    }
  });

// create a POST route for checking the sources
router.post('/check-sources',
  authorization, // require authorization middleware
  async (req, res, next) => {
    try {
      // extract the sources array and the user id from the request body
      const {sources} = req.body;
      const {id} = req.decoded;

      // create a new sources array
      const newSources = [];

      // loop through the sources array and check if each source exists in the database for the logged in user
      for (let i = 0; i < sources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const result = await Source.findOne({name: sources[i], owner: mongoose.Types.ObjectId(id)});
        if (!result) {
          // if the source doesn't exist, add it to the new sources array
          newSources.push(sources[i]);
        }
      }

      // loop through the new sources array and add each source to the database
      for (let i = 0; i < newSources.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Source({
          name: newSources[i],
          type: 'stomp',
          url: '',
          login: '',
          passcode: '',
          vhost: '',
          owner: mongoose.Types.ObjectId(id)
        }).save();
      } 
      
      // return the success flag and the new sources array in the response
      return res.json({
        success: true,
        newSources
      });
    } catch (err) {
      // handle errors by passing them to the error handling middleware
      return next(err.body);
    }
  });

// export the router for use in other files
module.exports = router;
