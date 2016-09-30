'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function HasManyGetter(model, association, opts, params) {

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return parseInt(params.page.number) * params.page.size;
    } else {
      return 5;
    }
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * params.page.size;
    } else {
      return 0;
    }
  }
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

  function getProjection() {
    var projection = {};
    projection[params.associationName] = 1;
    projection._id = 0;

    return projection;
  }

  function getRecords() {
    return new P(function (resolve, reject) {
      return model
        .aggregate()
        .match({ _id: opts.mongoose.Types.ObjectId(params.recordId) })
        .unwind(params.associationName)
        .project(getProjection())
        .limit(getLimit())
        .skip(getSkip())
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve(records);
        });
    })
    .map(function (record) {
      return new P(function (resolve, reject) {
        var query = association.findById(record[params.associationName]);
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

  this.perform = function () {
    return P.all([count(), getRecords()]);
  };
}

module.exports = HasManyGetter;
