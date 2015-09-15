'use strict';
var P = require('bluebird');
var _ = require('lodash');

function ResourceFinder(model, schema, params) {

  function handlePopulate(query) {
    _.each(schema.fields, function (field) {
      if (field.reference) {
        query.populate({ path: field.field, select: '_id' });
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
