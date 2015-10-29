'use strict';
var _ = require('lodash');
var Inflector = require('inflected');

exports.getReferenceModel = function (mongoose, reference) {
  var referenceCollectionName = exports.getReferenceCollectionName(reference);
  var modelName = Inflector.classify(referenceCollectionName);

  var models = _.mapKeys(mongoose.models, function (value, key) {
    return key.toLowerCase();
  });

  return models[modelName.toLowerCase()];
};

exports.getReferenceField = function (reference) {
  return reference.split('.')[1];
};

exports.getReferenceCollectionName = function (reference) {
  return reference.split('.')[0];
};
