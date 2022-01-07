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

const getNestedFieldType = (mongooseSchema, nestedFieldPath) => {
  if (!mongooseSchema || !nestedFieldPath) return undefined;

  const [currentFieldName, ...deepNestedFieldPath] = nestedFieldPath.split('.');

  let nestedFieldDeclaration;

  if (mongooseSchema.tree) {
    nestedFieldDeclaration = mongooseSchema.tree[currentFieldName];
  } else if (mongooseSchema.type) {
    nestedFieldDeclaration = mongooseSchema.type[currentFieldName];
  } else {
    nestedFieldDeclaration = mongooseSchema[currentFieldName];
  }

  if (!nestedFieldDeclaration) return undefined;

  if (!deepNestedFieldPath.length) {
    return nestedFieldDeclaration.type || nestedFieldDeclaration;
  }

  return getNestedFieldType(nestedFieldDeclaration, deepNestedFieldPath?.join('.'));
};

exports.getNestedFieldType = getNestedFieldType;
