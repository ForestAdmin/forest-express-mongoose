'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');

function HasManyFinder(model, association, opts, params) {
  function count() {
    return new P(function (resolve, reject) {
      model.findById(params.recordId)
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record[params.associationName].length);
        });
    });
  }

  function handlePopulate(query) {
    var schema = Schemas.schemas[association.collection.name];

    _.each(schema.fields, function (field) {
      if (field.reference) {
        query.populate(field.field);
      }
    });
  }

  function getRecords() {
    return new P(function (resolve, reject) {
      model
        .findById(params.recordId)
        .populate({
          path: params.associationName,
          options: { limit: getLimit(), skip: getSkip() }
        })
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record[params.associationName]);
        });
    }).map(function (record) {
      return new P(function (resolve, reject) {
        var query = association.findById(record.id);
        handlePopulate(query);

        query.lean().exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
      });
    });
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    } else {
      return 10;
    }
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  this.perform = function () {
    return P.all([count(), getRecords()]);
  };
}

module.exports = HasManyFinder;
