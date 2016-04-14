'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Interface = require('forest-express');

function ResourceGetter(model, params) {
  var schema = Interface.Schemas.schemas[model.modelName];

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

module.exports = ResourceGetter;
