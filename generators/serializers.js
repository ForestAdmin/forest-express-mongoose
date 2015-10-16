'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');

function SerializerFactory(model) {
  var schema = Schemas.schemas[model.collection.name];

  this.perform = function () {
    return new P(function (resolve) {
      var serializationOptions = {
        id: '_id',
        ref: '_id',
        attributes: _.map(schema.fields, 'field')
      };

      return resolve(serializationOptions);
    });
  };
}

module.exports = {
  serializersOptions: [],
  perform: function (models) {
    var that = this;

    return P.each(models, function (model) {
      return new SerializerFactory(model)
        .perform()
        .then(function (serializer) {
          that.serializersOptions[model.collection.name] = serializer;
        });
    });
  }
};
