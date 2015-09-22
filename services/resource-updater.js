'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Schemas = require('../generators/schemas');

function ResourceUpdater(model, params) {
  var schema = Schemas.schemas[model.collection.name];

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model
        .findByIdAndUpdate(params.id, {
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
