'use strict';
var _ = require('lodash');
var moment = require('moment');
var Interface = require('forest-express');
var utils = require('../utils/schema');

var PERIODS_PAST = '$past';
var PERIODS_FUTURE = '$future';
var PERIODS_TODAY = '$today';
var PERIODS_YESTERDAY = '$yesterday';
var PERIODS_PREVIOUS_WEEK = '$previousWeek';
var PERIODS_PREVIOUS_MONTH = '$previousMonth';
var PERIODS_PREVIOUS_QUARTER = '$previousQuarter';
var PERIODS_PREVIOUS_YEAR = '$previousYear';
var PERIODS_WEEK_TO_DATE = '$weekToDate';
var PERIODS_MONTH_TO_DATE = '$monthToDate';
var PERIODS_QUARTER_TO_DATE = '$quarterToDate';
var PERIODS_YEAR_TO_DATE = '$yearToDate';

var VALUES_DATE = [
  PERIODS_PAST,
  PERIODS_FUTURE,
  PERIODS_TODAY,
  PERIODS_YESTERDAY,
  PERIODS_PREVIOUS_WEEK,
  PERIODS_PREVIOUS_MONTH,
  PERIODS_PREVIOUS_QUARTER,
  PERIODS_PREVIOUS_YEAR,
  PERIODS_WEEK_TO_DATE,
  PERIODS_MONTH_TO_DATE,
  PERIODS_QUARTER_TO_DATE,
  PERIODS_YEAR_TO_DATE
];

var PERIODS_PREVIOUS_X_DAYS = /^\$previous(\d+)Days$/;
var PERIODS_X_DAYS_TO_DATE = /^\$(\d+)DaysToDate$/;
var PERIODS_X_HOURS_BEFORE = /^\$(\d+)HoursBefore$/;
var PERIODS_X_HOURS_AFTER = /^\$(\d+)HoursAfter$/;

function OperatorValueParser(opts, timezone) {

  this.perform = function (model, key, value) {
    var schema = Interface.Schemas.schemas[utils.getModelName(model)];
    var parseFct = function (val) { return val; };
    var ret = null;

    var fieldValues = key.split(':');
    var fieldName = fieldValues[0];
    var subfieldName = fieldValues[1];

    // Mongoose Aggregate don't parse the value automatically.
    var field = _.findWhere(schema.fields, { field: fieldName });

    var isEmbeddedField = !!field.type.fields;
    if (isEmbeddedField) {
      field = _.findWhere(field.type.fields, { field: subfieldName });
    }

    var offsetClient = parseInt(timezone, 10);
    var offsetServer = moment().utcOffset() / 60;
    var offsetHours = offsetServer - offsetClient;

    if (field) {
      switch (field.type) {
        case 'Number':
          parseFct = parseInt;
          break;
        case 'Date':
          parseFct = function (val) { return new Date(val); };
          break;
        case 'Boolean':
          parseFct = function (val) {
            if (val === 'true') { return true; }
            if (val === 'false') { return false; }
            return null;
          };
          break;
        case 'String':
          parseFct = function (val) {
            // NOTICE: Check if the value is a real ObjectID. By default, the
            // isValid method returns true for a random string with length 12.
            // Example: 'Black Friday'.
            if (opts.mongoose.Types.ObjectId.isValid(val) &&
              opts.mongoose.Types.ObjectId(val).toString() === val) {
              return opts.mongoose.Types.ObjectId(val);
            } else {
              return val;
            }
          };
          break;
      }

      if (_.isArray(field.type)) {
        parseFct = function (val) { return { $size: val }; };
      }
    }

    function isIntervalDateValue(value) {
      var match = value.match(PERIODS_PREVIOUS_X_DAYS);
      if (match && match[1]) { return true; }

      match = value.match(PERIODS_X_DAYS_TO_DATE);
      if (match && match[1]) { return true; }

      match = value.match(PERIODS_X_HOURS_BEFORE);
      if (match && match[1]) { return true; }

      match = value.match(PERIODS_X_HOURS_AFTER);
      if (match && match[1]) { return true; }

      return VALUES_DATE.indexOf(value) !== -1;
    }

    function getIntervalDateValue(value) {
      var from = null;
      var to = null;

      if (value === PERIODS_FUTURE) {
        return { $gte: moment().toDate() };
      }

      if (value === PERIODS_PAST) {
        return { $lte: moment().toDate() };
      }

      if (value === PERIODS_TODAY) {
        return {
          $gte: moment().startOf('day').add(offsetHours, 'h').toDate(),
          $lte: moment().endOf('day').add(offsetHours, 'h').toDate()
        };
      }

      var match = value.match(PERIODS_PREVIOUS_X_DAYS);
      if (match && match[1]) {
        return {
          $gte: moment().subtract(match[1], 'days').startOf('day').add(offsetHours, 'h').toDate(),
          $lte: moment().subtract(1, 'days').endOf('day').add(offsetHours, 'h').toDate()
        };
      }

      match = value.match(PERIODS_X_DAYS_TO_DATE);
      if (match && match[1]) {
        return {
          $gte: moment().subtract(match[1] - 1, 'days').startOf('day').toDate(),
          $lte: moment().toDate()
        };
      }

      match = value.match(PERIODS_X_HOURS_BEFORE);
      if (match && match[1]) {
        return { $lte: moment().subtract(match[1], 'hours').toDate() };
      }

      match = value.match(PERIODS_X_HOURS_AFTER);
      if (match && match[1]) {
        return { $gte: moment().subtract(match[1], 'hours').toDate() };
      }

      switch (value) {
        case PERIODS_YESTERDAY:
          from = moment().subtract(1, 'days').startOf('day').add(offsetHours, 'h').toDate();
          to = moment().subtract(1, 'days').endOf('day').add(offsetHours, 'h').toDate();
          break;
        case PERIODS_PREVIOUS_WEEK:
          from = moment().subtract(1, 'weeks').startOf('isoWeek').add(offsetHours, 'h').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').add(offsetHours, 'h').toDate();
          break;
        case PERIODS_PREVIOUS_MONTH:
          from = moment().subtract(1, 'months').startOf('month').add(offsetHours, 'h').toDate();
          to = moment().subtract(1, 'months').endOf('month').add(offsetHours, 'h').toDate();
          break;
        case PERIODS_PREVIOUS_QUARTER:
          from = moment().subtract(1, 'quarters').startOf('quarter').add(offsetHours, 'h').toDate();
          to = moment().subtract(1, 'quarters').endOf('quarter').add(offsetHours, 'h').toDate();
          break;
        case PERIODS_PREVIOUS_YEAR:
          from = moment().subtract(1, 'years').startOf('year').add(offsetHours, 'h').toDate();
          to = moment().subtract(1, 'years').endOf('year').add(offsetHours, 'h').toDate();
          break;
        case PERIODS_WEEK_TO_DATE:
          from = moment().startOf('week').add(offsetHours, 'h').toDate();
          to = moment().toDate();
          break;
        case PERIODS_MONTH_TO_DATE:
          from = moment().startOf('month').add(offsetHours, 'h').toDate();
          to = moment().toDate();
          break;
        case PERIODS_QUARTER_TO_DATE:
          from = moment().startOf('quarter').add(offsetHours, 'h').toDate();
          to = moment().toDate();
          break;
        case PERIODS_YEAR_TO_DATE:
          from = moment().startOf('year').add(offsetHours, 'h').toDate();
          to = moment().toDate();
          break;
      }

      return { $gte: from, $lte: to };
    }

    if (value[0] === '!' && value[1] !== '*') {
      value = value.substring(1);
      ret = { $ne: parseFct(value) };
    } else if (value[0] === '>') {
      value = value.substring(1);
      ret = { $gt: parseFct(value) };
    } else if (value[0] === '<') {
      value = value.substring(1);
      ret = { $lt: parseFct(value) };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      ret = new RegExp('.*' + parseFct(value) + '.*');
    } else if (value[0] === '!' && value[1] === '*' && value[value.length - 1] === '*') {
      value = value.substring(2, value.length - 1);
      ret = { $not: new RegExp('.*' + parseFct(value) + '.*') };
    } else if (value[0] === '*') {
      value = value.substring(1);
      ret = new RegExp('.*' + parseFct(value) + '$');
    } else if (value[value.length - 1] === '*') {
      value = value.substring(0, value.length - 1);
      ret = new RegExp('^' + parseFct(value) + '.*');
    } else if (value === '$present') {
      ret = { $exists: true };
    } else if (value === '$blank') {
      ret = { $exists: false };
    } else if (isIntervalDateValue(value)) {
      ret = getIntervalDateValue(value);
    } else {
      ret = parseFct(value);
    }

    return ret;
  };
}

module.exports = OperatorValueParser;
