const jwt = require('jsonwebtoken');
const { path, ifElse, isNil, startsWith, slice, identity, pipe } = require('ramda');

// Get the server secret from an environment variable
const secret = process.env.SERVER_SECRET;

// Export a middleware function that checks a token's presence and validity in a request
module.exports = (req, res, next) => {
  /**
   * Check if the token is present and valid in the request.
   * If the token is present and valid, call the next middleware function.
   * If the token is missing or invalid, return an error.
   */

  // Use the ramda library to create a functional pipeline for processing the token
  pipe(
    // Get the token from the query string, x-access-token header, or authorization header
    (r) =>
      path(['query', 'token'], r)
          || path(['headers', 'x-access-token'], r)
          || path(['headers', 'authorization'], r),

    // Remove the 'Bearer ' prefix from the token (if present)
    ifElse(
      (t) => !isNil(t) && startsWith('Bearer ', t),
      (t) => slice(7, t.length, t).trimLeft(),
      identity
    ),

    // If the token is missing, return an error; otherwise, verify the token
    ifElse(
      isNil,
      () =>
        next({
          message: 'Authorization Error: token missing.',
          status: 403
        }),
      (token) =>
        jwt.verify(token, secret, (e, d) =>
          ifElse(
            // If there is an error verifying the token, return an error
            (err) => !isNil(err),
            (er) => {
              if (er.name === 'TokenExpiredError') {
                next({
                  message: 'TokenExpiredError',
                  status: 401,
                });
              }
              next({
                message: 'Authorization Error: Failed to verify token.',
                status: 403
              });
            },
            // If the token is verified successfully, attach the decoded token to the request and call the next middleware function
            (_, decoded) => {
              req.decoded = decoded;
              return next();
            }
          )(e, d))
    )
  )(req);
};

