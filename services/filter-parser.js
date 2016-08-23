'use strict';
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function FilterParser(model, opts) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  this.perform = function (query, key, values, fct) {
    var q = {};

    var fieldValues = key.split(':');
    var fieldName = fieldValues[0];
    var subfieldName = fieldValues[1];

    var field = _.findWhere(schema.fields, { field: fieldName });

    var isEmbeddedField = !!field.type.fields;
    if (subfieldName && !isEmbeddedField) { return query; }

    values.split(',').forEach(function (value) {
      // Search using a $where operator when the key field is an array and
      // the operator is < or >.
      if (_.isArray(field.type) && ['>', '<'].indexOf(value[0]) > -1) {
        query.$where('this.' + key + ' && ' + 'this.' + key + '.length ' +
          value);
      } else {
        var filter = new OperatorValueParser(opts).perform(model, key, value);

        if (isEmbeddedField) {
          q[fieldName + '.' + subfieldName] = filter;
        } else {
          q[key] = filter;
        }

        if (!fct) { fct = 'where'; }
        query[fct](q);
      }
    });

    return query;
  };
}

module.exports = FilterParser;
