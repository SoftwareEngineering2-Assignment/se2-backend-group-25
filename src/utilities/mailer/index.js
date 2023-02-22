// Importing the password module
const password = require('./password');

// Importing the send module
const send = require('./send');

// Exporting an object with mail and send properties
module.exports = {
  // Exports the password module as mail property
  mail: password,
  // Exports the send module as send property
  send
};
