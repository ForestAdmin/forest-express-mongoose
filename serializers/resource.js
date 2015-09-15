'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');

function ResourceSerializer(model, schema, records, opts, meta) {

  this.perform = function () {
    var typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, function (field) {
        if (_.isPlainObject(field.type)) {
          dest[field.field] = {
            attributes: _.map(field.type.fields, 'field')
          };

          getAttributesFor(dest[field.field], field.type.fields);
        } else if (field.reference) {
          typeForAttributes[field.field] = field.reference.substring(0,
            field.reference.length - '._id'.length);

          dest[field.field] = {
            ref: '_id',
            attributes: [],
            included: false,
            relationshipLinks: {
              related: function (dataSet, relationship) {
                return {
                  meta: { count: relationship.length || 0 }
                };
              }
            }
          };
        }
      });
    }

    var serializationOptions = {
      id: '_id',
      attributes: _.map(schema.fields, 'field'),
      keyForAttribute: function (key) {
        return Inflector.underscore(key);
      },
      typeForAttribute: function (attribute) {
        return typeForAttributes[attribute] || attribute;
      },
      meta: meta
    };

    getAttributesFor(serializationOptions, schema.fields);

    return new JSONAPISerializer(model.collection.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
