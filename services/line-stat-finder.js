'use strict';
var _ = require('lodash');
var Inflector = require('inflected');
var P = require('bluebird');
var Schemas = require('../generators/schemas');
var OperatorValueParser = require('./operator-value-parser');

// jshint sub: true
function LineStatFinder(model, params, opts) {
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

  function findReferenceModel(field) {
    var collectionName = field.reference.split('.')[0];
    var modelName = Inflector.camelize(Inflector.singularize(collectionName));

    return opts.mongoose.models[modelName];
  }

  function handlePopulate(records, reference) {
    return new P(function (resolve, reject) {
      var referenceModel = findReferenceModel(reference);

      referenceModel.populate(records.value, {
        path: 'values.key'
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
      var sort = {};

      groupBy[params['group_by_field']] = '$' + params['group_by_field'];

      if (params['group_by_date_field']) {
        groupBy[params['group_by_date_field']] = '$' + params['group_by_date_field'];
        sort['_id.' + params['group_by_date_field']] = 1;
      }

      var sum = 1;
      if (params['aggregate_field']) {
        sum = '$' + params['aggregate_field'];
      }

      model
        .aggregate()
        .match(getFilters())
        .group({
          _id: groupBy,
          count: { $sum: '$price' }
        })
        .sort(sort)
        .project({
          label: '$_id.' + params['group_by_date_field'],
          values: {
            key: '$_id.'+  params['group_by_field'],
            value: '$count'
          },
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

module.exports = LineStatFinder;
