'use strict';
var _ = require('lodash');
var Inflector = require('inflected');
var JSONAPISerializer = require('jsonapi-serializer');
var Serializers = require('../generators/serializers');
var Schemas = require('../generators/schemas');

function ResourceSerializer(model, records, opts, meta) {
  var schema = Schemas.schemas[model.collection.name];
  var serializerOptions = Serializers
    .serializersOptions[model.collection.name];

  var typeForAttributes = {};

  schema.fields.forEach(function (field) {
    if (field.reference) {
      var ref = field.reference.substring(0, field.reference.length -
        '._id'.length);

      typeForAttributes[field.field] = ref;

      serializerOptions[field.field] = Serializers.serializersOptions[ref];
      if (_.isArray(field.type)) {
        serializerOptions[field.field].ignoreRelationshipData = true;
        serializerOptions[field.field].relationshipLinks = {
          related: function (dataSet, relationship) {
            return {
              href: '/forest/' + model.collection.name + '/' + dataSet._id +
                '/' + field.field,
              meta: { count: relationship.length || 0 }
            };
          }
        };
      }
    }
  });

  serializerOptions.meta = meta;

  serializerOptions.keyForAttribute = function (key) {
    return Inflector.underscore(key);
  };

  serializerOptions.typeForAttribute = function (attribute) {
    return typeForAttributes[attribute] || attribute;
  };

  this.perform = function () {
    return new JSONAPISerializer(schema.name, records, serializerOptions);
  };
}

module.exports = ResourceSerializer;
