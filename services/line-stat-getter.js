'use strict';
var _ = require('lodash');
var P = require('bluebird');
var FilterParser = require('./filter-parser');
var SchemaUtils = require('../utils/schema');
var moment = require('moment');
var Interface = require('forest-express');

// jshint sub: true
function LineStatFinder(model, params, opts) {
  var schema = Interface.Schemas.schemas[model.modelName];

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

  function buildDate(record, momentRange) {
    switch(momentRange) {
      case 'day':
        return moment.utc().year(record._id.year).month(record._id.month)
          .day(record._id.day).startOf(momentRange);
      case 'week':
        return moment.utc().year(record._id.year).week(record._id.week)
          .day('Monday').startOf(momentRange);
      case 'month':
        return moment.utc().year(record._id.year).month(record._id.month)
          .day('Monday').startOf(momentRange);
      case 'year':
        return moment.utc().year(record._id.year).day('Monday')
          .startOf(momentRange);
    }
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
            groupBy['year'] = { $year: '$' + params['group_by_date_field'] };
            groupBy['month'] = { $month: '$' + params['group_by_date_field'] };
            groupBy['day'] = { $dayOfMonth: '$' + params['group_by_date_field'] };
            break;
          case 'Week':
            groupBy['week'] = { $week: '$' + params['group_by_date_field'] };
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
          $first: '$' + params['group_by_date_field']
        };

        query = query.group(group);
      }

      query.sort(sort)
        .project({
          values: {
            key: '$_id.'+  params['group_by_field'],
            value: '$count'
          },
        })
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve(records);
        });
    })
    .then(function (records) {
      if (!records.length) { return { value: [] }; }
      var momentRange = params['time_range'].toLowerCase();

      var firstDate = buildDate(records[0], momentRange);
      var lastDate = buildDate(records[records.length - 1], momentRange)
        .add(1, momentRange);

      var recordsWithEmptyValues = [];
      var i = firstDate;
      var j = 0;

      records = records.map(function (record) {
        record.label = buildDate(record, momentRange).toISOString();
        return record;
      });

      while (i < lastDate) {
        var currentRecord = _.findWhere(records, { label: i.toISOString() });
        var value = currentRecord ? currentRecord.values.value : 0;

        recordsWithEmptyValues.push({
          label: i.toISOString(),
          values: { value: value }
        });

        i = i.add(1, momentRange);
        ++j;
      }

      return { value: recordsWithEmptyValues };
    })
    .then(function (records) {
      if (populateGroupByField) {
        return handlePopulate(records, populateGroupByField);
      } else {
        return records;
      }
    });
  };
}

module.exports = LineStatFinder;
