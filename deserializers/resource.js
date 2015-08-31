'use strict';
var P = require('bluebird');
var SchemaAdapter = require('../adapters/mongoose');
var humps = require('humps');

function ResourceDeserializer(model, params, opts) {

  function extractAttributes() {
    return new P(function (resolve) {
      var attributes = params.data.attributes;
      attributes._id = params.data.id;
      resolve(attributes);
    });
  }

  this.perform = function () {
    return new SchemaAdapter(model, opts)
      .then(function (schema) {
        return extractAttributes(schema)
          .then(function (params) {
            return humps.camelizeKeys(params);
          });
      });
  };
}

module.exports = ResourceDeserializer;
