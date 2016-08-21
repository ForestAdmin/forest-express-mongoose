'use strict';

exports.getReferenceModel = function (mongoose, reference) {
  return mongoose.models[exports.getReferenceCollectionName(reference)];
};

exports.getReferenceField = function (reference) {
  return reference.split('.')[1];
};

exports.getReferenceCollectionName = function (reference) {
  return reference.split('.')[0];
};

exports.getModelName = function (model) {
  return model.collection.name.replace(' ', '');
};
