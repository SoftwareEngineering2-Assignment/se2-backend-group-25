const min = 5; // minimum length for passwords
const expires = '12h'; // time period after which tokens expire

module.exports = {
  min, // exporting the minimum length constant as part of the module object
  expires // exporting the expiration time constant as part of the module object
};
