'use strict';
var _ = require('lodash');
var Schemas = require('../generators/schemas');
var OperatorValueParser = require('./operator-value-parser');

function FilterParser(model, opts) {
  var schema = Schemas.schemas[model.collection.name];

  this.perform = function (query, key, values, fct) {
    var q = {};

    var field = _.findWhere(schema.fields, { field: key });
    if (!field) { return; }

    values.split(',').forEach(function (value) {
      // Search using a $where operator when the key field is an array and
      // the operator is < or >.
      if (_.isArray(field.type) && ['>', '<'].indexOf(value[0]) > -1) {
        query.$where('this.' + key + ' && ' + 'this.' + key + '.length ' +
          value);
      } else {
        if (key.indexOf(':') > -1) {
          var splitted = key.split(':');
          var fieldName = splitted[0];

          field = _.findWhere(schema.fields, { field: fieldName });
          if (field && !field.reference) {
            key = key.replace(/:/g, '.');
            q[key] = new OperatorValueParser(opts).perform(model, key, value);
          }
        } else {
          q[key] = new OperatorValueParser(opts).perform(model, key, value);
        }

        if (!fct) { fct = 'where'; }
        query[fct](q);
      }
    });

    return query;
  };
}

module.exports = FilterParser;
