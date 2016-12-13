'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function ResourceUpdater(model, params) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  this.perform = function () {
    return new P(function (resolve, reject) {
      var recordId = params._id;

      // NOTICE: Old versions of MongoDB (2.X) seem to refuse the presence of
      //         the _id in the $set. So we remove it. It is useless anyway.
      delete params._id;

      var query = model
        .findByIdAndUpdate(recordId, {
          $set: params
        }, {
          new: true
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
    });
  };
}

module.exports = ResourceUpdater;
