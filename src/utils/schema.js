'use strict';
var mongooseUtils = require('../services/mongoose-utils');

exports.getReferenceModel = function (options, reference) {
  var models = mongooseUtils.getModels(options);
  return models[exports.getReferenceCollectionName(reference)];
};

exports.getReferenceField = function (reference) {
  return reference.split('.')[1];
};

exports.getReferenceCollectionName = function (reference) {
  return reference.split('.')[0];
};

exports.getModelName = function (model) {
  return model.modelName;
};

// TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority
exports.getModelNameOld = function (model) {
  return model.collection.name.replace(' ', '');
};
