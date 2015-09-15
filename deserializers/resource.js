'use strict';
var _ = require('lodash');
var P = require('bluebird');
var humps = require('humps');

function ResourceDeserializer(model, schema, params) {

  function extractAttributes() {
    return new P(function (resolve) {
      var attributes = params.data.attributes;
      attributes._id = params.data.id;
      resolve(attributes);
    });
  }

  function extractRelationships() {
    return new P(function (resolve) {
      var relationships = {};

      _.each(schema.fields, function (field) {
        if (field.reference && params.data.relationships[field.field]) {
          relationships[field.field] = params.data.relationships[field.field]
            .data.id;
        }
      });

      resolve(relationships);
    });
  }

  this.perform = function () {
    return P.all([extractAttributes(), extractRelationships()])
      .spread(function (attributes, relationships) {
        return humps.camelizeKeys(_.extend(attributes, relationships));
      });
  };
}

module.exports = ResourceDeserializer;
