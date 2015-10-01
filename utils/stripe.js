'use strict';
var Inflector = require('inflected');

exports.getReferenceModel = function (mongoose, reference) {
  var referenceCollectionName = exports.getReferenceCollectionName(reference);
  var modelName = Inflector.classify(referenceCollectionName);
  return mongoose.models[modelName];
};

exports.getReferenceField = function (reference) {
  return reference.split('.')[1];
};

exports.getReferenceCollectionName = function (reference) {
  return reference.split('.')[0];
};
