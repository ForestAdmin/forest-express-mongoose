'use strict';
var P = require('bluebird');
var SchemaAdapter = require('../adapters/mongoose');

module.exports = {
  schemas: [],
  perform: function (models, opts) {
    var that = this;

    return P.each(models, function (model) {
      return new SchemaAdapter(model, opts)
        .then(function (schema) {
          that.schemas[model.collection.name] = schema;
        });
    });
  }
};
