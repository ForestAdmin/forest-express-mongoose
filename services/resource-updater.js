'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Interface = require('forest-express');

function ResourceUpdater(model, params) {
  var schema = Interface.Schemas.schemas[model.modelName];

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model
        .findByIdAndUpdate(params._id, {
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
