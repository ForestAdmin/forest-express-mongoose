'use strict';
var _ = require('lodash');
var Schemas = require('../generators/schemas');
var moment = require('moment');

function OperatorValueParser(opts) {

  this.perform = function (model, fieldName, value) {
    var schema = Schemas.schemas[model.collection.name];
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
    }

    function getValue() {
      switch (value) {
        case 'yesterday':
          return moment().subtract(1, 'days').toDate();
        case 'lastWeek':
          return moment().subtract(1, 'weeks').toDate();
        case 'last2Weeks':
          return moment().subtract(2, 'weeks').toDate();
        case 'lastMonth':
          return moment().subtract(1, 'months').toDate();
        case 'last3Months':
          return moment().subtract(3, 'months').toDate();
        case 'lastYear':
          return moment().subtract(1, 'years').toDate();
        default:
          return value;
      }
    }

    if (value[0] === '!') {
      value = value.substring(1);
      ret = { $ne: parseFct(getValue()) };
    } else if (value[0] === '>') {
      value = value.substring(1);
      ret = { $gt: parseFct(getValue()) };
    } else if (value[0] === '<') {
      value = value.substring(1);
      ret = { $lt: parseFct(getValue()) };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      ret = new RegExp('.*' + parseFct(getValue()) + '.*');
    } else if (value[0] === '*') {
      value = value.substring(1);
      ret = new RegExp('.*' + parseFct(getValue()) + '$');
    } else if (value[value.length - 1] === '*') {
      value = value.substring(0, value.length - 1);
      ret = new RegExp('^' + parseFct(getValue()) + '.*');
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
