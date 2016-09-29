'use strict';
var P = require('bluebird');
var _ = require('lodash');
var flat = require('flat');
var utils = require('../utils/schema');
var Interface = require('forest-express');

module.exports = function (model, opts) {
  var fields = [];
  var paths = flat.unflatten(model.schema.paths);
  var mongoose = opts.mongoose;
  // mongoose.base is used when opts.mongoose is not the default connection.
  var Schema = mongoose.Schema || mongoose.base.Schema;

  function objectType(object, getType) {
    var type = { fields: [] };

    Object.keys(object).forEach(function (key) {
      var fields = {
        field: key,
        type: getType(key)
      };

      if (!fields.type) { return; }

      var ref = detectReference(object[key]);
      if (ref) { fields.reference = ref; }

      type.fields.push(fields);
    });

    return type;
  }

  function schemaType(type) {
    return {
      fields: _.map(type.paths, function (type, field) {
        return { field: field, type: getTypeFromMongoose(type) };
      })
    };
  }

  function getTypeFromNative(type) {
    if (type instanceof Array) {
      if (_.isEmpty(type)) {
        return [null];
      } else {
        return [getTypeFromNative(type[0].type || type[0])];
      }
    } else if (_.isPlainObject(type)) {
      if (_.isEmpty(type)) { return null; }

      if (type.type) {
        return getTypeFromNative(type.type);
      } else {
        return objectType(type, function (key) {
          return getTypeFromNative(type[key]);
        });
      }
    } else if (_.isFunction(type) && type.name === 'ObjectId') {
      return 'String';
    } else if (type instanceof Schema) {
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
    }
  }

  function getTypeFromMongoose(opts) {
    if (_.isPlainObject(opts) && !opts.path) {
      // Deal with Object
      return objectType(opts, function (key) {
        return getTypeFromMongoose(opts[key]);
      });
    } else if (opts.instance === 'Array') {
      // Deal with Array
      if (opts.caster.instance) {
        return [getTypeFromMongoose(opts.caster)];
      } else {
        if (opts.options.type[0] instanceof Schema) {
          // Schema
          return [schemaType(opts.options.type[0])];
        } else {
          // Object
          return [objectType(opts.options.type[0], function (key) {
            return getTypeFromNative(opts.options.type[0][key]);
          })];
        }
      }
    } else if (opts.enumValues && opts.enumValues.length) {
      return 'Enum';
    } else if (opts.instance === 'ObjectID') {
      // Deal with ObjectID
      return 'String';
    } else if (opts.instance === 'Mixed') {
      // Deal with Mixed object
      return null;
    } else {
      // Deal with primitive type
      return opts.instance ||
        (opts.options && getTypeFromNative(opts.options.type)) || null;
    }
  }

  function formatRef(ref) {
    if (opts.mongoose.models[ref]) {
      return utils.getModelName(opts.mongoose.models[ref]);
    } else {
      Interface.logger.warn('Cannot find the reference \"' + ref +
        '\" on the model \"' + model.modelName + '\".');
    }
  }

  function detectReference(opts) {
    if (opts.options) {
      if (opts.options.ref && opts.options.type) {
        return formatRef(opts.options.ref) + '._id';
      } else if (_.isArray(opts.options.type) && opts.options.type.length &&
        opts.options.type[0].ref && opts.options.type[0].type) {
        return formatRef(opts.options.type[0].ref) + '._id';
      }
    }
  }

  function detectRequireFlag(opts) {
   return !!opts.isRequired;
  }

  function getSchema(path) {
    var opts = paths[path];

    var schema = { field: path, type: getTypeFromMongoose(paths[path]) };

    var ref = detectReference(opts);
    if (ref) { schema.reference = ref; }

    var isRequired = !!detectRequireFlag(opts);
    if (isRequired) { schema.isRequired = isRequired; }

    if (opts.enumValues && opts.enumValues.length) {
      schema.enums = opts.enumValues;
    }

    return schema;
  }

  return P
    .each(Object.keys(paths), function (path) {
      if (path === '__v') { return; }
      var schema = getSchema(path);
      fields.push(schema);
    })
    .then(function () {
      return {
        name: utils.getModelName(model),
        idField: '_id',
        fields: fields
      };
    });
};

