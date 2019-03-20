'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');
var createError = require('http-errors');

function ResourceGetter(model, params) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

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
        .exec(function (error, record) {
          if (!record) {
            reject(createError(404, 'The ' + model.name + ' #' +
              params.recordId + ' does not exist.'));
          }
          if (error) { return reject(error); }
          resolve(record);
        });
    });
  };
}

module.exports = ResourceGetter;
