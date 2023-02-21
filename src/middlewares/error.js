/* eslint-disable no-console */ // Disables no-console warning for this module
const {pipe, has, ifElse, assoc, identity, allPass, propEq} = require('ramda');

module.exports = (error, req, res, next) => 
  /**
   * @name error
   * @description Middleware that handles errors
   */
  req;
  next;
  pipe(
    (e) => ({...e, message: e.message}), // Extracts message property from the error and adds it to a new object with spread syntax
    ifElse(has('status'), identity, assoc('status', 500)), // Adds 500 status code if the error object doesn't have a status property
    withFormatMessageForProduction, // Formats message property for production environment and 500 status code errors
    (fError) => res.status(fError.status).json(fError) // Sends the formatted error as a JSON response
  )(error);

const withFormatMessageForProduction = ifElse(
  allPass([propEq('status', 500), () => process.env.NODE_ENV === 'production']), // Checks if the error status is 500 and if the environment is production
  assoc('message', 'Internal server error occurred.'), // Adds a generic error message for production environment and 500 status code errors
  identity // Returns the original error object if the conditions aren't met
);
