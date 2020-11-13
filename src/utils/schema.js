exports.getReferenceModel = (options, reference) => {
  const { models } = options;
  return models[exports.getReferenceCollectionName(reference)];
};

exports.getReferenceField = (reference) => reference.split('.')[1];

exports.getReferenceCollectionName = (reference) => reference.split('.')[0];

exports.getModelName = (model) => model.modelName;

// TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority
exports.getModelNameOld = (model) => model.collection.name.replace(' ', '');
