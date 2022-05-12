import _ from 'lodash';
import Interface from 'forest-express';
import FieldIntrospector from '../utils/field-analyser';
import { getMongooseSchemaFromFieldPath } from '../utils/schema';

const FLATTEN_SEPARATOR = '@@@';

module.exports = class Flattener {
  constructor(schema, flatten, model, lianaOptions) {
    this.schema = schema;
    this.flatten = flatten;
    this.model = model;
    this.lianaOptions = lianaOptions;
  }

  _removeWrongFlattenConfiguration(index) {
    this.flatten.splice(index, 1);
  }

  _doesFieldExist(fieldName, index) {
    const fieldToFlatten = this.schema.fields
      .find((field) => field.field === fieldName);

    if (!fieldToFlatten) {
      Interface.logger.warn(`Could not flatten field ${fieldName} because it does not exist`);
      this._removeWrongFlattenConfiguration(index);
      return false;
    }

    return true;
  }

  static _validateLevelProperty(flattenConfiguration) {
    if (flattenConfiguration.level !== undefined) {
      flattenConfiguration.level = parseInt(flattenConfiguration.level, 10);

      if (Number.isNaN(flattenConfiguration.level)) {
        Interface.logger.warn(`Could not parse flatten level for field ${flattenConfiguration.field}, defaulting to infinite`);
        delete flattenConfiguration.level;
      }
    }
  }

  _validateFlattenObjectConfiguration(flattenConfiguration, configurationIndex) {
    if (!flattenConfiguration.field) {
      Interface.logger.warn(`Could not flatten field with the following configuration ${JSON.stringify(flattenConfiguration)} because no field has been specified`);
      this._removeWrongFlattenConfiguration(configurationIndex);
    } else if (this._doesFieldExist(flattenConfiguration.field, configurationIndex)) {
      Flattener._validateLevelProperty(flattenConfiguration);
    }
  }

  static _isFieldFlattened(name) {
    return name?.includes(FLATTEN_SEPARATOR);
  }

  static _getParentFieldName(fieldName) {
    return fieldName?.split(FLATTEN_SEPARATOR)[0];
  }

  static _unflattenCollectionFields(requestedFields) {
    const fieldNames = new Set();
    requestedFields.split(',')
      .forEach((requestedField) => fieldNames.add(Flattener._getParentFieldName(requestedField)));
    return [...fieldNames].join(',');
  }

  static _unflattenFields(request) {
    Object.entries(request.query.fields).forEach(([collection, requestedFields]) => {
      if (Flattener._isFieldFlattened(requestedFields)) {
        request.query.fields[collection] = Flattener._unflattenCollectionFields(requestedFields);
      }
    });
  }

  static _unflattenAttribute(attributeName, value, attributes) {
    let accessPathArray = attributeName.split(FLATTEN_SEPARATOR);
    const parentObjectName = accessPathArray.shift();
    accessPathArray = accessPathArray.reverse();
    const parentObject = attributes[parentObjectName] || {};
    const unflattenedProperty = accessPathArray.reduce((a, prop) => ({ [prop]: a }), value);
    const unflattenedObject = _.merge(parentObject, unflattenedProperty);
    return { parentObjectName, unflattenedObject };
  }

  static _unwrapFlattenedReferences(request) {
    if (!request.body.data.attributes) request.body.data.attributes = {};

    const { attributes, relationships } = request.body.data;

    Object.entries(relationships)
      .filter(([attributeName]) => Flattener._isFieldFlattened(attributeName))
      .forEach(([attributeName, value]) => {
        const { parentObjectName, unflattenedObject } = Flattener._unflattenAttribute(
          attributeName,
          value.data?.id,
          attributes,
        );
        attributes[parentObjectName] = _.merge(attributes[parentObjectName], unflattenedObject);
        delete relationships[attributeName];
      });
  }

  static _unflattenAttributes(request) {
    Object.entries(request.body.data.attributes).forEach(([attributeName, value]) => {
      if (Flattener._isFieldFlattened(attributeName)) {
        const {
          parentObjectName,
          unflattenedObject,
        } = Flattener._unflattenAttribute(attributeName, value, request.body.data.attributes);
        delete request.body.data.attributes[attributeName];
        request.body.data.attributes[parentObjectName] = unflattenedObject;
      }
    });
  }

  static _unflattenSubsetQuery(request) {
    Object.entries(request.body.data.attributes.all_records_subset_query)
      .forEach(([key, value]) => {
        if (key.includes('fields') && Flattener._isFieldFlattened(value)) {
          request.body.data.attributes.all_records_subset_query[key] = Flattener
            ._unflattenCollectionFields(value);
        }
      });
  }

  static requestUnflattener(request, response, next) {
    if (request.originalUrl.includes('.csv?')) {
      return next();
    }

    try {
      if (!_.isEmpty(request.body?.data?.attributes)) {
        Flattener._unflattenAttributes(request);

        if (!_.isEmpty(request.body.data.attributes.all_records_subset_query)) {
          Flattener._unflattenSubsetQuery(request);
        }
      }
      if (!_.isEmpty(request.body?.data?.relationships)) {
        Flattener._unwrapFlattenedReferences(request);
      }
      if (!_.isEmpty(request.query?.fields)) {
        Flattener._unflattenFields(request);
      }
      if (!_.isEmpty(request.query?.context)) {
        request.query.context.field = Flattener.unflattenFieldName(request.query.context.field);
      }
      return next();
    } catch (error) { return next(error); }
  }

  static unflattenParams(params) {
    const unflattenedParams = JSON.parse(JSON.stringify(params));

    if (unflattenedParams.fields) {
      Object.entries(unflattenedParams.fields).forEach(([collection, requestedFields]) => {
        if (Flattener._isFieldFlattened(requestedFields)) {
          unflattenedParams
            .fields[collection] = Flattener._unflattenCollectionFields(requestedFields);
        }
      });
    }

    return unflattenedParams;
  }

  validateOptions() {
    if (!this.flatten) {
      this.flatten = [];
      return;
    }

    if (!Array.isArray(this.flatten)) {
      this.flatten = [];
      Interface.logger.error(`Could not flatten fields from collection ${this.schema.name}, flatten property should be an array.`);
      return;
    }

    this.flatten.forEach((flattenConfiguration, index) => {
      switch (typeof flattenConfiguration) {
        case 'string':
          this.flatten[index] = { field: flattenConfiguration };
          this._doesFieldExist(flattenConfiguration, index);
          break;
        case 'object':
          this._validateFlattenObjectConfiguration(flattenConfiguration, index);
          break;
        default: {
          Interface.logger.warn(`Could not identify the field to flatten with ${JSON.stringify(flattenConfiguration)}`);
        }
      }
    });
  }

  _flattenField(schema, parentFieldName, newFields = [], level = undefined) {
    if (schema.type?.fields && (level === undefined || level > -1)) {
      schema.type.fields.forEach((subField) => {
        const newFieldName = parentFieldName ? `${parentFieldName}${FLATTEN_SEPARATOR}${subField.field}` : schema.field;
        this._flattenField(
          subField,
          newFieldName,
          newFields,
          level === undefined ? level : level - 1,
        );
      });
    } else {
      schema.field = parentFieldName;

      const fieldInfo = getMongooseSchemaFromFieldPath(
        schema.field.split(FLATTEN_SEPARATOR).join('.'),
        this.model,
      );

      if (typeof schema.type === 'string' && fieldInfo) {
        const introspectedSchema = new FieldIntrospector(this.model, this.lianaOptions)
          .getFieldSchema(schema.field, fieldInfo);

        newFields.push(introspectedSchema);
      } else {
        newFields.push(schema);
      }
    }
  }

  flattenFields() {
    this.validateOptions();

    const newFields = [];

    this.flatten.forEach((flattenConfiguration) => {
      const fieldSchemaIndex = this.schema.fields
        .findIndex((field) => field.field === flattenConfiguration.field);
      const fieldSchema = this.schema.fields[fieldSchemaIndex];

      this._flattenField(fieldSchema, fieldSchema.field, newFields, flattenConfiguration.level);

      this.schema.fields.splice(fieldSchemaIndex, 1);
    });

    this.schema.fields = [...this.schema.fields, ...newFields];
  }

  static unflattenFieldName(fieldName) {
    if (!fieldName) return null;

    return fieldName.replace(new RegExp(FLATTEN_SEPARATOR, 'g'), '.');
  }

  static splitOnSeparator(fieldName) {
    return fieldName.split(FLATTEN_SEPARATOR);
  }

  static unflattenFieldNamesInObject(object) {
    Object.keys(object).forEach((fieldName) => {
      if (Flattener._isFieldFlattened(fieldName)) {
        object[Flattener.unflattenFieldName(fieldName)] = object[fieldName];
        delete object[fieldName];
      }
    });
  }

  static flattenRecordDataForUpdates(record, flattenComposedKey, flattenedFields) {
    if (flattenedFields.length === 0) return record;

    const flattenedRecord = {};

    Object.keys(record).forEach((attribute) => {
      if (record[attribute] !== null && typeof record[attribute] === 'object') {
        const flattenedPath = (flattenComposedKey) ? `${flattenComposedKey}${FLATTEN_SEPARATOR}${attribute}` : attribute;

        if (flattenedFields.find((flattenedField) => flattenedField === flattenedPath)) {
          flattenedRecord[attribute] = record[attribute];
        } else {
          const flattenedNested = Flattener
            .flattenRecordDataForUpdates(record[attribute], flattenedPath, flattenedFields);
          Object.keys(flattenedNested).forEach((nestedAttribute) => {
            flattenedRecord[`${attribute}.${nestedAttribute}`] = flattenedNested[nestedAttribute];
          });
        }
      } else {
        flattenedRecord[attribute] = record[attribute];
      }
    });

    return flattenedRecord;
  }

  static getFlattenedFieldsName(fields) {
    return fields
      .filter((field) => Flattener._isFieldFlattened(field.field))
      .map((field) => field.field);
  }

  static getFlattenedReferenceFieldsFromParams(collectionName, fields) {
    if (!collectionName || !fields) {
      return [];
    }

    const flattenedReferences = Object.keys(fields)
      .filter((field) => Flattener._isFieldFlattened(field));

    const collectionReferenceFields = (Interface.Schemas.schemas[collectionName]?.fields || [])
      .filter(({ reference }) => reference);

    return flattenedReferences.filter((flattenedReference) =>
      collectionReferenceFields.some(({ field }) => field === flattenedReference));
  }

  static generateNestedPathsFromModelName(modelName) {
    if (!modelName) return [];

    const modelFields = (Interface.Schemas.schemas[modelName]?.fields || []);
    const flattenedFields = modelFields
      .filter((field) => this._isFieldFlattened(field.field));

    return flattenedFields.map((field) => this.splitOnSeparator(field.field));
  }

  static flattenRecordsForExport(modelName, records) {
    const nestedPaths = this.generateNestedPathsFromModelName(modelName);

    if (!nestedPaths || nestedPaths.length === 0) return records;

    records.forEach((record) => {
      const flattenedFields = new Set();

      nestedPaths.forEach((nestedPath) => {
        const flattenFieldName = nestedPath.join(FLATTEN_SEPARATOR);
        record[flattenFieldName] = nestedPath
          .reduce((embedded, attribute) => (embedded ? embedded[attribute] : null), record);
        flattenedFields.add(nestedPath[0]);
      });

      flattenedFields.forEach((flattenedField) => delete record[flattenedField]);
    });

    return records;
  }
};
