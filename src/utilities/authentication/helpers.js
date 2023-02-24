// Import necessary libraries and functions
const {genSaltSync, hashSync, compareSync} = require('bcryptjs');
const {sign} = require('jsonwebtoken');
const {pipe} = require('ramda');

module.exports = {
  /**
   * @name passwordDigest
   * @description Is used to hash the password before saving it to the db
   * @param {string} password - The password to be hashed
   * @param {number} saltWorkFactor - The factor to use for generating a salt (default is 10)
   * @returns {string} The hashed password
   */
  passwordDigest: (password, saltWorkFactor = 10) =>
    // Use Ramda's `pipe` function to apply a series of functions to the password
    pipe(
      // Generate a salt with the specified work factor
      genSaltSync,
      // Hash the password with the generated salt
      (salt) => hashSync(password, salt)
    )(saltWorkFactor),

  /**
   * @name comparePassword
   * @description Is used to compare password with hash
   * @param {string} password - The password to compare
   * @param {string} hash - The hash to compare the password against
   * @returns {boolean} `true` if the password matches the hash, `false` otherwise
   */
  comparePassword: (password, hash) => compareSync(password, hash),

  /**
   * @name jwtSign
   * @description Is used to sign jwt with payload (after authenticate)
   * @param {Object} payload - The payload to sign
   * @returns {string} The signed JWT
   */
  jwtSign: (payload) => sign(payload, process.env.SERVER_SECRET),
};
