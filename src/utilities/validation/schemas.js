const {isNil} = require('ramda');

const yup = require('yup');
const {min} = require('./constants');

// Create a yup schema for email validation
const email = yup
  .string()
  .lowercase()
  .trim()
  .email();

// Create a yup schema for username validation
const username = yup
  .string()
  .trim();

// Create a yup schema for password validation with minimum length as 'min'
const password = yup
  .string()
  .trim()
  .min(min);

// Create a yup schema for request validation with username as required field
const request = yup.object().shape({username: username.required()});

// Create a yup schema for authenticate validation with username and password as required fields
const authenticate = yup.object().shape({
  username: username.required(),
  password: password.required()
});

// Create a yup schema for register validation with email, password and username as required fields
const register = yup.object().shape({
  email: email.required(),
  password: password.required(),
  username: username.required()
});

// Create a yup schema for update validation with optional username and password fields and a custom test to check for missing parameters
const update = yup.object().shape({
  username,
  password
}).test({
  message: 'Missing parameters',
  test: ({username: u, password: p}) => !(isNil(u) && isNil(p))
});

// Create a yup schema for change validation with password as required field
const change = yup.object().shape({password: password.required()});

module.exports = {
  authenticate, register, request, change, update
};

