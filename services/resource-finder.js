'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Schemas = require('../generators/schemas');

function ResourceFinder(model, params) {
  var schema = Schemas.schemas[model.collection.name];

  function handlePopulate(query) {
    _.each(schema.fields, function (field) {
      if (field.reference) {
        query.populate(field.field);
      }
    });
  }

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model.findById(params.recordId);

      handlePopulate(query);

      query
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  };
}

module.exports = ResourceFinder;
