'use strict';

exports.getReferenceModel = function (mongoose, reference) {
  // TODO: Adapt the code here
  return mongoose.models[exports.getReferenceCollectionName(reference)];
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
