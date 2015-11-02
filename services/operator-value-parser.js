'use strict';
var _ = require('lodash');
var Schemas = require('../generators/schemas');

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

    if (value[0] === '!') {
      ret = { $ne: parseFct(value.substring(1)) };
    } else if (value[0] === '>') {
      ret = { $gt: parseFct(value.substring(1)) };
    } else if (value[0] === '<') {
      ret = { $lt: parseFct(value.substring(1)) };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      ret = new RegExp('.*' + parseFct(value.substring(1, value.length - 1)) +
        '.*');
    } else if (value[0] === '*') {
      ret = new RegExp('.*' + parseFct(value.substring(1)) + '$');
    } else if (value[value.length - 1] === '*') {
      ret = new RegExp('^' + parseFct(value.substring(0, value.length - 1)) +
        '.*');
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
