exports.getReferenceModel = (options, reference) => {
  const { connections } = options;
  return Object.values(connections)
    .reduce((models, connection) => models.concat(Object.values(connection.models)), [])
    .find((model) => exports.getModelName(model) === exports.getReferenceCollectionName(reference));
};

exports.getReferenceField = (reference) => reference.split('.')[1];

exports.getReferenceCollectionName = (reference) => reference.split('.')[0];

exports.getModelName = (model) => model.modelName;

// TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority
exports.getModelNameOld = (model) => model.collection.name.replace(' ', '');
