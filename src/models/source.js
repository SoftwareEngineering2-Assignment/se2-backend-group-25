/* eslint-disable func-names */
const mongoose = require('mongoose');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

mongoose.pluralize(null);

const SourceSchema = new mongoose.Schema(
  {
    // The name of the data source
    name: {
      index: true,
      type: String,
      required: [true, 'Source name is required']
    },
    // The type of data source
    type: {type: String},
    // The URL of the data source
    url: {type: String},
    // The login for the data source (if required)
    login: {type: String},
    // The passcode for the data source (if required)
    passcode: {type: String},
    // The virtual host of the data source (if required)
    vhost: {type: String},
    // The owner of the data source
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // The date the data source was created
    createdAt: {type: Date}
  }
);

// Plugin for Mongoose that turns duplicate errors into regular Mongoose validation errors.
SourceSchema.plugin(beautifyUnique);

// Pre save hook that sets the date the data source was created
SourceSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.createdAt = Date.now();
  }
  return next();
});

// Export the model for the data source
module.exports = mongoose.model('sources', SourceSchema);
