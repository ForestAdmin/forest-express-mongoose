'use strict';
var _ = require('lodash');
var moment = require('moment');
var Interface = require('forest-express');
var utils = require('../utils/schema');

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

    function isIntervalDateValue(value) {
      return value === 'yesterday' || value.indexOf('last') === 0;
    }

    function getIntervalDateValue(value) {
      var from = null;
      var to = null;

      var match = value.match(/^last(\d+)days$/);
      if (match && match[1]) {
        return { $gte: moment().subtract(match[1], 'days').toDate() };
      }

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
