'use strict';
var _ = require('lodash');
var P = require('bluebird');
var FilterParser = require('./filter-parser');
var SchemaUtils = require('../utils/schema');
var Interface = require('forest-express');
var utils = require('../utils/schema');

// jshint sub: true
function PieStatGetter(model, params, opts) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  function getReference(fieldName) {
    var field = _.findWhere(schema.fields, { field: fieldName });
    return field.reference ? field : null;
  }

  function handlePopulate(records, referenceField) {
    return new P(function (resolve, reject) {
      var referenceModel = SchemaUtils.getReferenceModel(opts.mongoose,
        referenceField.reference);

      referenceModel.populate(records.value, {
        path: 'key'
      }, function (err, records) {
        if (err) { return reject(err); }
        resolve({ value: records });
      });
    });
  }

  this.perform = function () {
    var populateGroupByField = getReference(params['group_by_field']);

    return new P(function (resolve, reject) {
      var groupBy = {};
      groupBy[params['group_by_field']] = '$' + params['group_by_field'];

      var query = model.aggregate();

      if (params.filterType && params.filters) {
        var operator = '$' + params.filterType;
        var queryFilters = {};
        queryFilters[operator] = [];

        _.each(params.filters, function (filter) {
          var conditions = new FilterParser(model, opts)
            .perform(filter.field, filter.value);
          _.each(conditions, function (condition) {
            queryFilters[operator].push(condition);
          });
        });

        query.match(queryFilters);
      }

      var sum = 1;
      if (params['aggregate_field']) {
        sum = '$' + params['aggregate_field'];
      }

      query
        .group({
          _id: groupBy,
          count: { $sum: sum }
        })
        .project({
          key: '$_id.' +  params['group_by_field'],
          value: '$count',
          _id: false
        })
        .sort({ value: -1 })
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve( {value: records });
        });
    }).then(function (records) {
      if (populateGroupByField) {
        return handlePopulate(records, populateGroupByField);
      } else {
        return records;
      }
    });
  };
}

module.exports = PieStatGetter;
