'use strict';
var _ = require('lodash');
var moment = require('moment');
var Interface = require('forest-express');
var utils = require('../utils/schema');

// TODO: Remove once new filter protocol is live
var PERIODS_FROM_NOW = 'fromNow';
var PERIODS_TODAY_DEPRECATED = 'today';
var PERIODS_YESTERDAY_DEPRECATED = 'yesterday';
var PERIODS_LAST_WEEK = 'lastWeek';
var PERIODS_LAST_2_WEEK = 'last2Weeks';
var PERIODS_LAST_MONTH = 'lastMonth';
var PERIODS_LAST_3_MONTH = 'last3Months';
var PERIODS_LAST_YEAR = 'lastYear';

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
  PERIODS_FROM_NOW, // TODO: Remove once new filter protocol is live
  PERIODS_TODAY_DEPRECATED, // TODO: Remove once new filter protocol is live
  PERIODS_YESTERDAY_DEPRECATED, // TODO: Remove once new filter protocol is live
  PERIODS_LAST_WEEK, // TODO: Remove once new filter protocol is live
  PERIODS_LAST_2_WEEK, // TODO: Remove once new filter protocol is live
  PERIODS_LAST_MONTH, // TODO: Remove once new filter protocol is live
  PERIODS_LAST_3_MONTH, // TODO: Remove once new filter protocol is live
  PERIODS_LAST_YEAR, // TODO: Remove once new filter protocol is live
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

// TODO: Remove once new filter protocol is live
var PERIODS_LAST_X_DAYS = /^last(\d+)days$/;

var PERIODS_PREVIOUS_X_DAYS = /^\$previous(\d+)Days$/;
var PERIODS_X_DAYS_TO_DATE = /^\$(\d+)DaysToDate$/;

function OperatorValueParser(opts) {

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

    if (field) {
      switch (field.type) {
        case 'Number':
          parseFct = parseInt;
          break;
        case 'Date':
          parseFct = function (val) { return new Date(val); };
          break;
        case 'Boolean':
          parseFct = function (val) { return val ? true : false; };
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
      // TODO: Remove once new filter protocol is live
      var match = value.match(PERIODS_LAST_X_DAYS);
      if (match && match[1]) { return true; }

      match = value.match(PERIODS_PREVIOUS_X_DAYS);
      if (match && match[1]) { return true; }
      match = value.match(PERIODS_X_DAYS_TO_DATE);
      if (match && match[1]) { return true; }

      return VALUES_DATE.indexOf(value) !== -1;
    }

    function getIntervalDateValue(value) {
      var from = null;
      var to = null;

      // TODO: Remove once new filter protocol is live
      if (value === PERIODS_FROM_NOW) {
        return { $gte: moment().toDate() };
      }

      if (value === PERIODS_FUTURE) {
        return { $gte: moment().toDate() };
      }

      if (value === PERIODS_PAST) {
        return { $lte: moment().toDate() };
      }

      // TODO: Remove once new filter protocol is live
      if (value === PERIODS_TODAY_DEPRECATED) {
        return {
          $gte: moment().startOf('day').toDate(),
          $lte: moment().endOf('day').toDate()
        };
      }

      if (value === PERIODS_TODAY) {
        return {
          $gte: moment().startOf('day').toDate(),
          $lte: moment().endOf('day').toDate()
        };
      }

      // TODO: Remove once new filter protocol is live
      var match = value.match(PERIODS_LAST_X_DAYS);
      if (match && match[1]) {
        return {
          $gte: moment().subtract(match[1], 'days').startOf('day').toDate(),
          $lte: moment().subtract(1, 'days').endOf('day').toDate()
        };
      }

      match = value.match(PERIODS_PREVIOUS_X_DAYS);
      if (match && match[1]) {
        return {
          $gte: moment().subtract(match[1], 'days').startOf('day').toDate(),
          $lte: moment().subtract(1, 'days').endOf('day').toDate()
        };
      }

      match = value.match(PERIODS_X_DAYS_TO_DATE);
      if (match && match[1]) {
        return {
          $gte: moment().subtract(match[1] - 1, 'days').startOf('day').toDate(),
          $lte: moment().toDate()
        };
      }

      switch (value) {
        // TODO: Remove once new filter protocol is live
        case PERIODS_YESTERDAY_DEPRECATED:
          from = moment().subtract(1, 'days').startOf('day').toDate();
          to = moment().subtract(1, 'days').endOf('day').toDate();
          break;
        case PERIODS_LAST_WEEK:
          from = moment().subtract(1, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case PERIODS_LAST_2_WEEK:
          from = moment().subtract(2, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case PERIODS_LAST_MONTH:
          from = moment().subtract(1, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case PERIODS_LAST_3_MONTH:
          from = moment().subtract(3, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case PERIODS_LAST_YEAR:
          from = moment().subtract(1, 'years').startOf('year').toDate();
          to = moment().subtract(1, 'years').endOf('year').toDate();
          break;

        case PERIODS_YESTERDAY:
          from = moment().subtract(1, 'days').startOf('day').toDate();
          to = moment().subtract(1, 'days').endOf('day').toDate();
          break;
        case PERIODS_PREVIOUS_WEEK:
          from = moment().subtract(1, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case PERIODS_PREVIOUS_MONTH:
          from = moment().subtract(1, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case PERIODS_PREVIOUS_QUARTER:
          from = moment().subtract(1, 'quarters').startOf('quarter').toDate();
          to = moment().subtract(1, 'quarters').endOf('quarter').toDate();
          break;
        case PERIODS_PREVIOUS_YEAR:
          from = moment().subtract(1, 'years').startOf('year').toDate();
          to = moment().subtract(1, 'years').endOf('year').toDate();
          break;
        case PERIODS_WEEK_TO_DATE:
          from = moment().startOf('week').toDate();
          to = moment().toDate();
          break;
        case PERIODS_MONTH_TO_DATE:
          from = moment().startOf('month').toDate();
          to = moment().toDate();
          break;
        case PERIODS_QUARTER_TO_DATE:
          from = moment().startOf('quarter').toDate();
          to = moment().toDate();
          break;
        case PERIODS_YEAR_TO_DATE:
          from = moment().startOf('year').toDate();
          to = moment().toDate();
          break;
      }

      return { $gte: from, $lte: to };
    }

    if (value[0] === '!') {
      value = value.substring(1);
      ret = { $ne: parseFct(value) };
    } else if (value[0] === '>') {
      value = value.substring(1);

      if (isIntervalDateValue(value)) {
        ret = getIntervalDateValue(value);
      } else {
        ret = { $gt: parseFct(value) };
      }
    } else if (value[0] === '<') {
      value = value.substring(1);

      if (isIntervalDateValue(value)) {
        ret = getIntervalDateValue(value);
      } else {
        ret = { $lt: parseFct(value) };
      }
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      ret = new RegExp('.*' + parseFct(value) + '.*');
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
