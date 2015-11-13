'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');
var Schemas = require('../generators/schemas');

function ResourceSerializer(model, records, opts, meta, include) {
  var schema = Schemas.schemas[model.collection.name];

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
          var referenceType = typeForAttributes[field.field] =
            field.reference.substring(0, field.reference.length -
              '._id'.length);

          var referenceSchema = Schemas.schemas[referenceType];

          dest[field.field] = {
            ref: '_id',
            attributes: _.map(referenceSchema.fields, 'field'),
            relationshipLinks: {
              related: function (dataSet, relationship) {
                var ret = {
                  href: '/forest/' + model.collection.name + '/' +
                    dataSet._id + '/' + field.field,
                };

                if (_.isArray(field.type)) {
                  ret.meta = { count: relationship.length || 0 };
                }

                return ret;
              }
            }
          };

          if (_.isArray(field.type)) {
            dest[field.field].ignoreRelationshipData = true;
            dest[field.field].included = false;
          }
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

    if (include) {
      _.forEach(include, function (reference, fieldName) {
        fieldName = fieldName.split(':')[0];

        serializationOptions.attributes.push(fieldName);

        var referenceType = typeForAttributes[fieldName] =
          reference.substring(0, reference.length - '._id'.length);

        var referenceSchema = Schemas.schemas[referenceType];

        serializationOptions[fieldName] = {
          ref: '_id',
          attributes: _.map(referenceSchema.fields, 'field'),
          relationshipLinks: {
            related: function (dataSet, relationship) {
              return { meta: { count: relationship.length } };
            }
          }
        };
      });
    }

    return new JSONAPISerializer(schema.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
