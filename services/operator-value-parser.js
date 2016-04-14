'use strict';
var _ = require('lodash');
var moment = require('moment');
var Interface = require('forest-express');

function OperatorValueParser(opts) {

  this.perform = function (model, fieldName, value) {
    var schema = Interface.Schemas.schemas[model.modelName];
    var parseFct = function (val) { return val; };
    var ret = null;

    // Mongoose Aggregate don't parse the value automatically.
    var field = _.findWhere(schema.fields, { field: fieldName });
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
            if (opts.mongoose.Types.ObjectId.isValid(val)) {
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

    function getIntervalDateValue(value) {
      var from = null;
      var to = null;

      switch (value) {
        case 'yesterday':
          from = moment().subtract(1, 'days').startOf('day').toDate();
          to = moment().subtract(1, 'days').endOf('day').toDate();
          break;
        case 'lastWeek':
          from = moment().subtract(1, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case 'last2Weeks':
          from = moment().subtract(2, 'weeks').startOf('isoWeek').toDate();
          to = moment().subtract(1, 'weeks').endOf('isoWeek').toDate();
          break;
        case 'lastMonth':
          from = moment().subtract(1, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case 'last3Months':
          from = moment().subtract(3, 'months').startOf('month').toDate();
          to = moment().subtract(1, 'months').endOf('month').toDate();
          break;
        case 'lastYear':
          from = moment().subtract(1, 'years').startOf('year').toDate();
          to = moment().subtract(1, 'years').endOf('year').toDate();
          break;
      }

      return { $gte: from, $lte: to };
    }

    function isIntervalDateValue(value) {
      return ['yesterday', 'lastWeek', 'last2Weeks', 'lastMonth',
        'last3Months', 'lastYear'].indexOf(value) > -1;
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
    } else {
      ret = parseFct(value);
    }

    return ret;
  };
}

module.exports = OperatorValueParser;
