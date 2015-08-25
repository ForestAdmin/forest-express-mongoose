'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');
var MongooseUtils = require('../services/mongoose-utils');

function ResourceSerializer(model, records, meta) {

  this.perform = function () {
    var serializationOptions = {
      id: '_id',
      attributes: Object.keys(model.schema.paths),
      keyForAttribute: function (key) {
        return Inflector.underscore(key);
      },
      typeForAttribute: function (attribute) {
        var ref = MongooseUtils.getReference(model.schema.paths[attribute]);
        if (ref) {
          return Inflector.pluralize(ref.toLowerCase());
        } else {
          return attribute;
        }
      },
      meta: meta
    };

    _.each(model.schema.paths, function (value, key) {
      var ref = MongooseUtils.getReference(value);
      if (ref) {
        serializationOptions[key] = {
          ref: '_id',
          attributes: []
        };
      }
    });

    return new JSONAPISerializer(model.collection.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
