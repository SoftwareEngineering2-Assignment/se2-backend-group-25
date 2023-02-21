const {schemas: validationSchemas} = require('../utilities/validation');

module.exports = async (req, res, next, schema) => {
  /**
   * @name validation
   * @description Middleware that tests the validity of a body given a specified schema
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @param {function} next - The next function in the middleware chain.
   * @param {string} schema - The name of the schema to use for validation.
   * @throws {Object} - Error object containing status and message properties.
   */

  try {
    const {body} = req;
    await validationSchemas[schema].validate(body);
    next();
  } catch (err) {
    next({
      message: `Validation Error: ${err.errors[0]}`,
      status: 400
    });
  }
};
