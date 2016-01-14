'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');
var FilterParser = require('./filter-parser');
var SchemaUtils = require('../utils/schema');

// jshint sub: true
function LineStatFinder(model, params, opts) {
  var schema = Schemas.schemas[model.collection.name];

  function getReference(fieldName) {
    if (!fieldName) { return null; }
    var field = _.findWhere(schema.fields, { field: fieldName });
    return field.reference ? field : null;
  }

  function handlePopulate(records, referenceField) {
    return new P(function (resolve, reject) {
      var referenceModel = SchemaUtils.getReferenceModel(opts.mongoose,
        referenceField.reference);

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

      if (params['group_by_field']) {
        groupBy[params['group_by_field']] = '$' + params['group_by_field'];
      }

      if (params['group_by_date_field']) {
        switch (params['time_range']) {
          case 'Day':
            groupBy['day'] = { $dayOfMonth: '$' + params['group_by_date_field'] };
            groupBy['month'] = { $month: '$' + params['group_by_date_field'] };
            groupBy['year'] = { $year: '$' + params['group_by_date_field'] };
            break;
          case 'Week':
            groupBy['week'] = { $week: '$' + params['group_by_date_field'] };
            groupBy['month'] = { $month: '$' + params['group_by_date_field'] };
            groupBy['year'] = { $year: '$' + params['group_by_date_field'] };
            break;
          case 'Year':
            groupBy['year'] = { $year: '$' + params['group_by_date_field'] };
            break;
          default: // Month
            groupBy['month'] = { $month: '$' + params['group_by_date_field'] };
            groupBy['year'] = { $year: '$' + params['group_by_date_field'] };
        }
        sort[params['group_by_date_field']] = 1;
      }

      var sum = 1;
      if (params['aggregate_field']) {
        sum = '$' + params['aggregate_field'];
      }

      var query = model
        .aggregate();

      if (params.filters) {
        _.each(params.filters, function (filter) {
          new FilterParser(model, opts).perform(query, filter.field,
            filter.value, 'match');

          return query;
        });
      }

      if (params['group_by_date_field']) {
        var q = {};
        q[params['group_by_date_field']] = { $ne: null };
        query = query.match(q);
      }

      if (groupBy) {
        var group = {
          _id: groupBy,
          count: { $sum: sum }
        };

        group[params['group_by_date_field']] = {
          $last: '$' + params['group_by_date_field']
        };

        query = query.group(group);
      }

      query.sort(sort)
        .project({
          label: '$' + params['group_by_date_field'],
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
