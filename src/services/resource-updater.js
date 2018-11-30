'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function ResourceUpdater(model, params, record) {
  var modelName = utils.getModelName(model);
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];
  var recordId;

  this.perform = function () {
    return new P(function (resolve, reject) {
      recordId = record._id;

      // NOTICE: Old versions of MongoDB (2.X) seem to refuse the presence of
      //         the _id in the $set. So we remove it. It is useless anyway.
      delete record._id;

      var query = model
        .findByIdAndUpdate(recordId, {
          $set: record
        }, {
          new: true,
          runValidators: true
        });

      _.each(schema.fields, function (field) {
        if (field.reference) { query.populate(field.field); }
      });

      query
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    })
      .catch(function (error) {
        if (error.message.indexOf('Cast to') > -1 && error.message.indexOf('failed for value') > -1) {
          Interface.logger.warn('Cannot update the ' + modelName + ' #' + recordId +
            ' because of a "type" key usage (which is a reserved keyword in Mongoose).');
        } else {
          Interface.logger.error('Cannot update the ' + modelName + ' #' + recordId +
            ' because of an unexpected issue: ' + error);
        }

        return model.findByIdAndUpdate(recordId);
      });
  };
}

module.exports = ResourceUpdater;
