'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');
var OperatorValueParser = require('./operator-value-parser');
var SchemaUtils = require('../utils/schema');

// jshint sub: true
function PieStatFinder(model, params, opts) {
  var schema = Schemas.schemas[model.collection.name];

  function getFilters() {
    var filters = {};

    if (params.filters) {
      params.filters.forEach(function (filter) {
        filters[filter.field] = new OperatorValueParser(opts).perform(model,
          filter.field, filter.value);
      });
    }

    return filters;
  }

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

      model
        .aggregate()
        .match(getFilters())
        .group({
          _id: groupBy,
          count: { $sum: 1 }
        })
        .project({
          key: '$_id.'+  params['group_by_field'],
          value: '$count',
          _id: false
        })
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

module.exports = PieStatFinder;
