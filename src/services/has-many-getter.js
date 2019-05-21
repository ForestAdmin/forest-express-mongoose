'use strict';
var _ = require('lodash');
var P = require('bluebird');
var SearchBuilder = require('./search-builder');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function HasManyGetter(model, association, opts, params) {
  var OBJECTID_REGEXP = /^[0-9a-fA-F]{24}$/;
  var schema = Interface.Schemas.schemas[utils.getModelName(association)];
  var searchBuilder = new SearchBuilder(association, opts, params);

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

  function getProjection() {
    var projection = {};
    projection[params.associationName] = 1;
    projection._id = 0;

    return projection;
  }

  function handlePopulate(query) {
    _.each(schema.fields, function (field) {
      if (field.reference) {
        query.populate({
          path: field.field
        });
      }
    });
  }

  function getRecords() {
    return new P(function (resolve, reject) {
      var id = params.recordId;
      if (OBJECTID_REGEXP.test(params.recordId)) {
        id = opts.mongoose.Types.ObjectId(id);
      }

      return model
        .aggregate()
        .match({ _id: id })
        .unwind(params.associationName)
        .project(getProjection())
        .exec(function (error, records) {
          if (error) { return reject(error); }
          resolve(_.map(records, function (record) {
            return record[params.associationName];
          }));
        });
    })
      .then(function (recordIds) {
        var conditions = {
          $and: [{ _id: { $in: recordIds }}]
        };

        if (params.search) {
          var conditionsSearch = searchBuilder.getConditions();
          conditions.$and.push(conditionsSearch);
        }

        var query = association.find(conditions);
        handlePopulate(query);

        return query.then(function(records) {
          return [records, recordIds];
        });
      })
      .then(function(recordsAndRecordIds) {
        var records = recordsAndRecordIds[0];
        var fieldSort = params.sort;
        var descending = false;

        if (params.sort && (params.sort[0] === '-')) {
          fieldSort = params.sort.substring(1);
          descending = true;
        }

        var recordsSorted;
        if (fieldSort) {
          recordsSorted = _.sortBy(records, function(record) {
            return record[fieldSort];
          });
        } else {
          var recordIds = recordsAndRecordIds[1];
          var recordIdStrings = recordIds.map(function(recordId) {
            // Convert values to strings, so ObjectIds could be easily searched and compared.
            return String(recordId);
          });
          // indexOf could be improved by making a Map from record-ids to their index.
          recordsSorted = _.sortBy(records, function(record) {
            return recordIdStrings.indexOf(String(record._id));
          });
        }
        return descending ? recordsSorted.reverse() : recordsSorted;
      });
  }

  this.perform = function () {
    return getRecords()
      .then(function (records) {
        var fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
        }

        records = _.slice(records, getSkip(), getSkip() + getLimit());

        return [records, fieldsSearched];
      });
  };

  this.count = function () {
    return getRecords()
      .then(function (records) {
        return records.length;
      });
  };
}

module.exports = HasManyGetter;
