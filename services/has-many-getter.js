'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function HasManyGetter(model, association, opts, params) {
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
    var schema = Interface.Schemas.schemas[utils.getModelName(association)];

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
    })
    .then(function(records) {
      if (params.sort) {
        var fieldSort = params.sort;
        var descending = false;

        if (params.sort[0] === '-') {
          fieldSort = params.sort.substring(1);
          descending = true;
        }

        var recordsSorted = _.sortBy(records, function(record) {
          return record[fieldSort];
        });

        return descending ? recordsSorted.reverse() : recordsSorted;
      } else {
        return records;
      }
    });
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 5;
    } else {
      return 5;
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

module.exports = HasManyGetter;
