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

  if (mongooseSchema.tree?.[currentFieldName]) {
    nestedFieldDeclaration = mongooseSchema.tree[currentFieldName];
  } else if (mongooseSchema.type?.[currentFieldName]) {
    nestedFieldDeclaration = mongooseSchema.type[currentFieldName];
  } else if (mongooseSchema[currentFieldName]) {
    nestedFieldDeclaration = mongooseSchema[currentFieldName];
  } else if (mongooseSchema.type?.tree?.[currentFieldName]) {
    nestedFieldDeclaration = mongooseSchema.type?.tree?.[currentFieldName];
  }

  if (!nestedFieldDeclaration) return undefined;

  if (!deepNestedFieldPath.length) {
    return nestedFieldDeclaration.type || nestedFieldDeclaration;
  }

  return getNestedFieldType(nestedFieldDeclaration, deepNestedFieldPath?.join('.'));
};

exports.getNestedFieldType = getNestedFieldType;

exports.getMongooseSchemaFromFieldPath = (fieldPath, model) => model.schema.paths[fieldPath]
  || model.schema.singleNestedPaths[fieldPath] || null;
