'use strict';
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function FilterParser(model, opts, timezone) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  this.perform = function (key, values) {
    var conditions = [];

    var fieldValues = key.split(':');
    var fieldName = fieldValues[0];
    var subfieldName = fieldValues[1];

    var field = _.findWhere(schema.fields, { field: fieldName });

    var isEmbeddedField = !!field.type.fields;
    if (subfieldName && !isEmbeddedField) { return []; }

    values.split(',').forEach(function (value) {
      var condition = {};
      var filter = new OperatorValueParser(opts, timezone)
        .perform(model, key, value);

      if (isEmbeddedField) {
        condition[fieldName + '.' + subfieldName] = filter;
      } else {
        condition[key] = filter;
      }

      conditions.push(condition);
    });

    return conditions;
  };
}

module.exports = FilterParser;
