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

      var query = model
        .aggregate();

      if (params.filters) {
        _.each(params.filters, function (filter) {
          new FilterParser(model, opts).perform(query, filter.field,
            filter.value, 'match');

          return query;
        });
      }

      query
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

module.exports = PieStatGetter;
