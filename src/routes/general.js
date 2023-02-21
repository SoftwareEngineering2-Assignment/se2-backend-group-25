/* eslint-disable max-len */
// Disable max length linter rule as some lines exceed the limit

const express = require('express');
const got = require('got');

const router = express.Router();

const User = require('../models/user');
const Dashboard = require('../models/dashboard');
const Source = require('../models/source');

// Route to get statistics about the app
router.get('/statistics',
async (req, res, next) => {
try {
// Count the number of documents in the users, dashboards, and sources collections
const users = await User.countDocuments();
const dashboards = await Dashboard.countDocuments();
const sources = await Source.countDocuments();
  // Aggregate the number of views across all dashboards
  const views = await Dashboard.aggregate([
    {
      $group: {
        _id: null, 
        views: {$sum: '$views'}
      }
    }
  ]);

  // If views were found, assign the total to totalViews
  let totalViews = 0;
  if (views[0] && views[0].views) {
    totalViews = views[0].views;
  }

  // Return the statistics as JSON
  return res.json({
    success: true,
    users,
    dashboards,
    views: totalViews,
    sources
  });
} catch (err) {
  return next(err.body);
}

});

// Route to test if a URL is active
router.get('/test-url',
async (req, res) => {
try {
// Get the URL to test from the query parameters
const {url} = req.query;
    // Send a request to the URL and get the status code
    const {statusCode} = await got(url);

    // Return the status code and whether the URL is active as JSON
    return res.json({
      status: statusCode,
      active: (statusCode === 200),
    });
  } catch (err) {
    // If there was an error, return a status of 500 and that the URL is not active
    return res.json({
      status: 500,
      active: false,
    });
  }

  });

// Route to test a URL with a specific request type
router.get('/test-url-request',
  async (req, res) => {
  try {
  // Get the URL, request type, headers, request body, and parameters from the query parameters
  const {url, type, headers, body: requestBody, params} = req.query;

      let statusCode;
      let body;

  // Send a request to the URL with the given request type and parameters
  switch (type) {
    case 'GET':
      ({statusCode, body} = await got(url, {
        headers: headers ? JSON.parse(headers) : {},
        searchParams: params ? JSON.parse(params) : {}
      }));
      break;
    case 'POST':
      ({statusCode, body} = await got.post(url, {
        headers: headers ? JSON.parse(headers) : {},
        json: requestBody ? JSON.parse(requestBody) : {}
      }));
      break;
    case 'PUT':
      ({statusCode, body} = await got.put(url, {
        headers: headers ? JSON.parse(headers) : {},
        json: requestBody ? JSON.parse(requestBody) : {}
      }));
      break;
    default:
      // If the request type is invalid, return a status of 500 and an error message
      statusCode = 500;
      body = 'Something went wrong';
  }

  // Return the status code and response as JSON
  return res.json({
    status: statusCode,
    response: body,
  });
    } catch (err) {
      return res.json({
        status: 500,
        response: err.toString(),
      });
    }
  });

module.exports = router;
