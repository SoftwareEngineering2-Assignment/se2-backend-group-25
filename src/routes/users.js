// Import necessary modules
const express = require('express');
const {validation, authorization} = require('../middlewares');
const {helpers: {jwtSign}} = require('../utilities/authentication');
const {mailer: {mail, send}} = require('../utilities');
const User = require('../models/user');
const Reset = require('../models/reset');

// Initialize router object
const router = express.Router();

// Route for user registration
router.post('/create',
  // Middleware for validating the request
  (req, res, next) => validation(req, res, next, 'register'),
  async (req, res, next) => {
    // Extract data from request body
    const {username, password, email} = req.body;
    try {
      // Check if a user with the given email or username already exists
      const user = await User.findOne({$or: [{username}, {email}]});
      if (user) {
        return res.json({
          status: 409,
          message: 'Registration Error: A user with that e-mail or username already exists.'
        });
      }
      // Create a new user with the provided data
      const newUser = await new User({
        username,
        password,
        email
      }).save();
      // Send success response with the new user's ID
      return res.json({success: true, id: newUser._id});
    } catch (error) {
      // Pass any errors to the error-handling middleware
      return next(error);
    }
  });

// Route for user authentication
router.post('/authenticate',
  // Middleware for validating the request
  (req, res, next) => validation(req, res, next, 'authenticate'),
  async (req, res, next) => {
    // Extract data from request body
    const {username, password} = req.body;
    try {
      // Find the user with the given username
      const user = await User.findOne({username}).select('+password');
      if (!user) {
        // If user doesn't exist, send an error response
        return res.json({
          status: 401,
          message: 'Authentication Error: User not found.'
        });
      }
      // Check if the provided password matches the user's password
      if (!user.comparePassword(password, user.password)) {
        // If passwords don't match, send an error response
        return res.json({
          status: 401,
          message: 'Authentication Error: Password does not match!'
        });
      }
      // If authentication is successful, send user data and a JWT token
      return res.json({
        user: {
          username, 
          id: user._id, 
          email: user.email
        },
        token: jwtSign({username, id: user._id, email: user.email})
      });
    } catch (error) {
      // Pass any errors to the error-handling middleware
      return next(error);
    }
  });

// Define route for resetting password
router.post('/resetpassword',
  // Validate the request body using the 'request' validation schema
  (req, res, next) => validation(req, res, next, 'request'),
  async (req, res, next) => {
    // Extract the username from the request body
    const {username} = req.body;
    try {
      // Find the user with the specified username
      const user = await User.findOne({username});
      if (!user) {
        // If the user is not found, return an error response
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      // Generate a new JWT token for the user
      const token = jwtSign({username});
      // Remove any existing reset tokens for the user
      await Reset.findOneAndRemove({username});
      // Save the new reset token for the user
      await new Reset({
        username,
        token,
      }).save();
      // Create the reset password email and send it to the user
      const email = mail(token);
      send(user.email, 'Forgot Password', email);
      // Return a success response
      return res.json({
        ok: true,
        message: 'Forgot password e-mail sent.'
      });
    } catch (error) {
      // Pass any errors to the next middleware
      return next(error);
    }
  });

// Define route for changing password
router.post('/changepassword',
  // Validate the request body using the 'change' validation schema
  (req, res, next) => validation(req, res, next, 'change'),
  // Require authentication for this route
  authorization,
  async (req, res, next) => {
    // Extract the new password from the request body
    const {password} = req.body;
    // Extract the username from the decoded JWT token
    const {username} = req.decoded;
    try {
      // Find the user with the specified username
      const user = await User.findOne({username});
      if (!user) {
        // If the user is not found, return an error response
        return res.json({
          status: 404,
          message: 'Resource Error: User not found.'
        });
      }
      // Find and remove the reset token for the user
      const reset = await Reset.findOneAndRemove({username});
      if (!reset) {
        // If no reset token is found, return an error response
        return res.json({
          status: 410,
          message: ' Resource Error: Reset token has expired.'
        });
      }
      // Update the user's password with the new password
      user.password = password;
      // Save the user's updated information
      await user.save();
      // Return a success response
      return res.json({
        ok: true,
        message: 'Password was changed.'
      });
    } catch (error) {
      // Pass any errors to the next middleware
      return next(error);
    }
  });

// Export the router
module.exports = router;
