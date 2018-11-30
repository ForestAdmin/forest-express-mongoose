'use strict';
/* jshint sub: true */
var _ = require('lodash');
var P = require('bluebird');
var FilterParser = require('./filter-parser');
var SchemaUtils = require('../utils/schema');
var moment = require('moment');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function LineStatFinder(model, params, opts) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];
  var timezone = (-parseInt(params.timezone, 10)).toString();
  var timezoneOffset = timezone * 60 * 60 * 1000;

  function getReference(fieldName) {
    if (!fieldName) { return null; }
    var field = _.findWhere(schema.fields, { field: fieldName });
    return field.reference ? field : null;
  }

  function handlePopulate(records, referenceField) {
    return new P(function (resolve, reject) {
      var referenceModel = SchemaUtils.getReferenceModel(opts,
        referenceField.reference);

      referenceModel.populate(records.value, {
        path: 'values.key'
      }, function (err, records) {
        if (err) { return reject(err); }
        resolve({ value: records });
      });
    });
  }

  function getFormat(momentRange) {
    switch(momentRange) {
      case 'day': return 'DD/MM/YYYY';
      case 'week': return '[W]w-YYYY';
      case 'month': return 'MMM YY';
      case 'year': return 'YYYY';
    }
  }

  function formatLabel(record, momentRange) {
    switch(momentRange) {
      case 'day':
        return moment().year(record._id.year)
          .month(record._id.month - 1).startOf('month')
          .add(record._id.day - 1, 'days').startOf(momentRange)
          .format(getFormat(momentRange));
      case 'week':
        return moment().year(record._id.year)
          .week(record._id.week)
          .startOf(momentRange).format(getFormat(momentRange));
      case 'month':
        return moment().year(record._id.year)
          .month(record._id.month - 1)
          .startOf(momentRange).format(getFormat(momentRange));
      case 'year':
        return record._id.year.toString();
    }
  }

  function setDate(record, momentRange) {
    switch(momentRange) {
      case 'day':
        return moment().year(record._id.year)
          .month(record._id.month - 1).startOf('month')
          .add(record._id.day - 1, 'days').startOf(momentRange);
      case 'week':
        return moment().year(record._id.year)
          .week(record._id.week).startOf(momentRange);
      case 'month':
        return moment().year(record._id.year)
          .month(record._id.month - 1).startOf(momentRange);
      case 'year':
        return moment().year(record._id.year).startOf(momentRange);
    }
  }

  function fillEmptyIntervals(records, momentRange, firstDate, lastDate) {
    var newRecords = [];

    var currentDate = firstDate;
    while (currentDate <= lastDate) {
      var currentLabel = currentDate.format(getFormat(momentRange));
      var currentRecord = _.findWhere(records, { label: currentLabel });
      var value = currentRecord ? currentRecord.values.value : 0;

      newRecords.push({
        label: currentLabel,
        values: { value: value }
      });

      currentDate = currentDate.add(1, momentRange);
    }

    return newRecords;
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
            groupBy['year'] = {
              $year: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            groupBy['month'] = {
              $month: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            groupBy['day'] = {
              $dayOfMonth: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            break;
          case 'Week':
            groupBy['week'] = {
              $week: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            groupBy['year'] = {
              $year: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            break;
          case 'Year':
            groupBy['year'] = {
              $year: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            break;
          default: // Month
            groupBy['month'] = {
              $month: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
            groupBy['year'] = {
              $year: [{
                $subtract: [ '$' + params['group_by_date_field'], timezoneOffset ]
              }]
            };
        }
        sort[params['group_by_date_field']] = 1;
      }

      var sum = 1;
      if (params['aggregate_field']) {
        sum = '$' + params['aggregate_field'];
      }

      var query = model
        .aggregate();

      if (params.filterType && params.filters) {
        var operator = '$' + params.filterType;
        var queryFilters = {};
        queryFilters[operator] = [];

        _.each(params.filters, function (filter) {
          var conditions = new FilterParser(model, opts, params.timezone)
            .perform(filter.field, filter.value);
          _.each(conditions, function (condition) {
            queryFilters[operator].push(condition);
          });
        });

        query.match(queryFilters);
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
            key: '$_id.'+ params['group_by_field'],
            value: '$count'
          },
        })
        .exec(function (error, records) {
          if (error) { return reject(error); }
          resolve(records);
        });
    })
      .then(function (records) {
        if (!records.length) { return { value: [] }; }
        var momentRange = params['time_range'].toLowerCase();
        var firstDate = setDate(records[0], momentRange);
        var lastDate = setDate(records[records.length - 1], momentRange);

        records = records.map(function (record) {
          return {
            label: formatLabel(record, momentRange),
            values: record.values
          };
        });

        return {
          value: fillEmptyIntervals(records, momentRange, firstDate, lastDate)
        };
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
