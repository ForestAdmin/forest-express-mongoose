const P = require('bluebird');
const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');
const mongooseUtils = require('../services/mongoose-utils');

/* eslint-disable */
function unflatten(data) {
  const result = {};
  for (var key in data) {
    var keys = key.split('.');
    keys.reduce((result, subKey, index) => {
      if (!result[subKey]) {
        if (Number.isNaN(Number(keys[index + 1]))) {
          result[subKey] = keys.length - 1 === index ? data[key] : {};
        } else {
          result[subKey] = [];
        }
      }
      return result[subKey];
    }, result);
  }
  return result;
}
/* eslint-enable */

module.exports = (model, opts) => {
  const fields = [];
  const paths = unflatten(model.schema.paths);
  const { mongoose } = opts;
  // NOTICE: mongoose.base is used when opts.mongoose is not the default connection.
  const Schema = mongoose.Schema || mongoose.base.Schema;
  let schemaType;

  function formatRef(ref) {
    const models = mongooseUtils.getModels(opts);
    if (models[ref]) {
      return utils.getModelName(models[ref]);
    }
    Interface.logger.warn(`Cannot find the reference "${ref}" on the model "${model.modelName}".`);
    return null;
  }

  function detectReference(fieldInfo) {
    if (fieldInfo.options) {
      if (fieldInfo.options.ref && fieldInfo.options.type) {
        return `${formatRef(fieldInfo.options.ref)}._id`;
      }
      if (_.isArray(fieldInfo.options.type) && fieldInfo.options.type.length
        && fieldInfo.options.type[0].ref && fieldInfo.options.type[0].type) {
        return `${formatRef(fieldInfo.options.type[0].ref)}._id`;
      }
    }
    return null;
  }

  function objectType(fieldsInfo, getType) {
    const type = { fields: [] };

    Object.keys(fieldsInfo).forEach((fieldName) => {
      const fieldInfo = fieldsInfo[fieldName];
      const field = {
        field: fieldName,
        type: getType(fieldName),
      };

      if (!field.type) { return; }

      const ref = detectReference(fieldInfo);
      if (ref) { field.reference = ref; }

      if (fieldInfo.enumValues && fieldInfo.enumValues.length) {
        field.enums = fieldInfo.enumValues;
      }

      // NOTICE: Detect enum values for Enums in subdocument arrays.
      if (fieldInfo.enum && fieldInfo.enum.length) {
        field.enums = fieldInfo.enum;
      }

      type.fields.push(field);
    });

    return type;
  }

  function getTypeFromNative(type) {
    if (type instanceof Array) {
      if (_.isEmpty(type)) {
        return [null];
      }
      return [getTypeFromNative(type[0].type || type[0])];
    }
    if (_.isPlainObject(type)) {
      if (_.isEmpty(type)) { return 'Json'; }

      if (type.type) {
        if (type.enum) {
          // NOTICE: Detect enum values for Enums in subdocument arrays.
          return 'Enum';
        }
        return getTypeFromNative(type.type);
      }
      return objectType(type, (key) => getTypeFromNative(type[key]));
    }
    if (_.isFunction(type) && type.name === 'ObjectId') {
      return 'String';
    }
    if (type instanceof Schema) {
      return schemaType(type);
    }

    switch (type) {
      case String:
        return 'String';
      case Boolean:
        return 'Boolean';
      case Number:
        return 'Number';
      case Date:
        return 'Date';
      default:
        return null;
    }
  }

  function getTypeFromMongoose(fieldInfo) {
    if (_.isPlainObject(fieldInfo) && !fieldInfo.path) {
      // Deal with Object
      return objectType(fieldInfo, (fieldName) => getTypeFromMongoose(fieldInfo[fieldName]));
    }
    if (fieldInfo.instance === 'Array') {
      if (_.isEmpty(fieldInfo.options.type) && !_.isUndefined(fieldInfo.options.type)) {
        return 'Json';
      }

      // Deal with Array
      if (fieldInfo.caster.instance && (fieldInfo.caster.options.ref
        || _.keys(fieldInfo.caster.options).length === 0)) {
        return [getTypeFromMongoose(fieldInfo.caster)];
      }
      if (fieldInfo.options.type[0] instanceof Schema) {
        // Schema
        return [schemaType(fieldInfo.options.type[0])];
      }

      // NOTICE: Object with `type` reserved keyword.
      //         See: https://mongoosejs.com/docs/schematypes.html#type-key
      if (fieldInfo.options.type[0] instanceof Object
        && fieldInfo.options.type[0].type
        // NOTICE: Bypass for schemas like `[{ type: {type: String}, ... }]` where "type" is used
        //         as property, and thus we are in the case of an array of embedded documents.
        //         See: https://mongoosejs.com/docs/faq.html#type-key
        && !fieldInfo.options.type[0].type.type) {
        return [getTypeFromNative(fieldInfo.options.type[0])];
      }

      // Object
      return [objectType(fieldInfo.options.type[0], (key) =>
        getTypeFromNative(fieldInfo.options.type[0][key]))];
    }
    if (fieldInfo.enumValues && fieldInfo.enumValues.length) {
      return 'Enum';
    }
    if (fieldInfo.instance === 'ObjectID') {
      // Deal with ObjectID
      return 'String';
    }
    if (fieldInfo.instance === 'Embedded') {
      return objectType(fieldInfo.schema.obj, (fieldName) =>
        getTypeFromNative(fieldInfo.schema.obj[fieldName]));
    }
    if (fieldInfo.instance === 'Mixed') {
      // Deal with Mixed object

      // NOTICE: Object and {} are detected as Json type as they don't have schema.
      if (_.isEmpty(fieldInfo.options.type) && !_.isUndefined(fieldInfo.options.type)) {
        return 'Json';
      }
      if (_.isEmpty(fieldInfo.options) && !_.isUndefined(fieldInfo.options)) {
        return 'Json';
      }

      return null;
    }
    // Deal with primitive type
    return fieldInfo.instance
      || (fieldInfo.options && getTypeFromNative(fieldInfo.options.type))
      || null;
  }

  schemaType = (type) => ({
    fields: _.map(type.paths, (fieldType, fieldName) => {
      const field = {
        field: fieldName,
        type: getTypeFromMongoose(fieldType),
      };

      if (fieldType.enumValues && fieldType.enumValues.length) {
        field.enums = fieldType.enumValues;
      }

      return field;
    }),
  });

  function getRequired(fieldInfo) {
    return fieldInfo.isRequired === true;
  }

  function getValidations(fieldInfo) {
    const validations = [];

    if (fieldInfo.validators && fieldInfo.validators.length > 0) {
      _.each(fieldInfo.validators, (validator) => {
        if (validator.type === 'required') {
          validations.push({
            type: 'is present',
          });
        }

        if (validator.type === 'minlength') {
          validations.push({
            type: 'is longer than',
            value: validator.minlength,
          });
        }

        if (validator.type === 'maxlength') {
          validations.push({
            type: 'is shorter than',
            value: validator.maxlength,
          });
        }

        if (validator.type === 'min') {
          validations.push({
            type: 'is greater than',
            value: validator.min,
          });
        }

        if (validator.type === 'max') {
          validations.push({
            type: 'is less than',
            value: validator.max,
          });
        }
      });
    }

    return validations;
  }

  function getFieldSchema(path) {
    const fieldInfo = paths[path];

    const schema = { field: path, type: getTypeFromMongoose(fieldInfo) };

    const ref = detectReference(fieldInfo);
    if (ref) { schema.reference = ref; }

    if (fieldInfo.enumValues && fieldInfo.enumValues.length) {
      schema.enums = fieldInfo.enumValues;
    }

    // NOTICE: Create enums from caster (for ['Enum'] type).
    if (fieldInfo.caster && fieldInfo.caster.enumValues && fieldInfo.caster.enumValues.length) {
      schema.enums = fieldInfo.caster.enumValues;
    }

    const isRequired = getRequired(fieldInfo);
    if (isRequired) {
      schema.isRequired = isRequired;
    }

    if (fieldInfo.options && !_.isNull(fieldInfo.options.default)
      && !_.isUndefined(fieldInfo.options.default)
      && !_.isFunction(fieldInfo.options.default)) {
      schema.defaultValue = fieldInfo.options.default;
    }

    schema.validations = getValidations(fieldInfo);

    if (schema.validations.length === 0) {
      delete schema.validations;
    }

    return schema;
  }

  return P
    .each(Object.keys(paths), (path) => {
      if (path === '__v') { return; }
      const field = getFieldSchema(path);
      fields.push(field);
    })
    .then(() => ({
      name: utils.getModelName(model),
      // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
      nameOld: model.collection.name.replace(' ', ''),
      idField: '_id',
      fields,
    }));
};
