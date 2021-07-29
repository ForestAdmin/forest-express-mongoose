import _ from 'lodash';

function isFieldFlattened(name) {
  return name?.includes('|');
}

function getParentFieldName(fieldName) {
  return fieldName?.split('|')[0];
}

function unflattenCollectionFields(requestedFields) {
  const fieldNames = new Set();
  requestedFields.split(',')
    .forEach((requestedField) => fieldNames.add(getParentFieldName(requestedField)));
  return [...fieldNames].join(',');
}

function unflattenFields(request) {
  Object.entries(request.query.fields).forEach(([collection, requestedFields]) => {
    if (isFieldFlattened(requestedFields)) {
      request.query.fields[collection] = unflattenCollectionFields(requestedFields);
    }
  });
}

function unflattenAttribute(attributeName, value, attributes) {
  let accessPathArray = attributeName.split('|');
  const parentObjectName = accessPathArray.shift();
  accessPathArray = accessPathArray.reverse();
  const parentObject = attributes[parentObjectName] || {};
  const unflattenedProperty = accessPathArray.reduce((a, prop) => ({ [prop]: a }), value);
  const unflattenedObject = _.merge(parentObject, unflattenedProperty);
  return { parentObjectName, unflattenedObject };
}

function unflattenAttributes(request) {
  Object.entries(request.body.data.attributes).forEach(([attributeName, value]) => {
    if (isFieldFlattened(attributeName)) {
      const {
        parentObjectName,
        unflattenedObject,
      } = unflattenAttribute(attributeName, value, request.body.data.attributes);
      delete request.body.data.attributes[attributeName];
      request.body.data.attributes[parentObjectName] = unflattenedObject;
    }
  });
}

function unflattenSubsetQuery(request) {
  Object.entries(request.body.data.attributes.all_records_subset_query).forEach(([key, value]) => {
    if (key.includes('fields') && isFieldFlattened(value)) {
      request.body.data.attributes.all_records_subset_query[key] = unflattenCollectionFields(value);
    }
  });
}

function requestUnflattener(request, response, next) {
  try {
    if (!_.isEmpty(request.body?.data?.attributes)) {
      unflattenAttributes(request);

      if (!_.isEmpty(request.body.data.attributes.all_records_subset_query)) {
        unflattenSubsetQuery(request);
      }
    }
    if (!_.isEmpty(request.query?.fields)) {
      unflattenFields(request);
    }
    next();
  } catch (error) { next(error); }
}

module.exports = requestUnflattener;
module.exports.isFieldFlattened = isFieldFlattened;
module.exports.getParentFieldName = getParentFieldName;
module.exports.unflattenCollectionFields = unflattenCollectionFields;
module.exports.unflattenFields = unflattenFields;
module.exports.unflattenAttribute = unflattenAttribute;
module.exports.unflattenAttributes = unflattenAttributes;
