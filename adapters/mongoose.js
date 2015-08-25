'use strict';
var P = require('bluebird');
var _ = require('lodash');
var flat = require('flat');
var Inflector = require('inflected');

module.exports = function (model, opts) {
  var fields = [];
  var paths = flat.unflatten(model.schema.paths);
  var mongoose = opts.mongoose;

  function objectType(object, getType) {
    var type = { fields: [] };

    Object.keys(object).forEach(function (key) {
      type.fields.push({
        field: key,
        type: getType(key)
      });
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

      return objectType(type, function (key) {
        return getTypeFromNative(type[key]);
      });
    } else if (_.isFunction(type) && type.name === 'ObjectId') {
      return 'String';
    } else if (type instanceof mongoose.Schema) {
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
        if (opts.options.type[0] instanceof mongoose.Schema) {
          // Schema
          return [schemaType(opts.options.type[0])];
        } else {
          // Object
          return [objectType(opts.options.type[0], function (key) {
            return getTypeFromNative(opts.options.type[0][key]);
          })];
        }
      }
    } else if (opts.instance === 'ObjectID') {
      // Deal with ObjectID
      return 'String';
    } else if (opts.instance === 'Mixed') {
      // Deal with Mixed object
      return null;
    } else {
      // Deal with primitive type
      return opts.instance || getTypeFromNative(opts.options.type) || null;
    }
  }

  function formatRef(ref) {
    return Inflector.pluralize(ref.toLowerCase());
  }

  function detectReference(opts) {
    if (opts.options) {
      if (opts.options.ref) {
        return formatRef(opts.options.ref) + '._id';
      } else if (_.isArray(opts.options.type) && opts.options.type.length &&
        opts.options.type[0].ref) {
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
      schema.enumValues = opts.enumValues;
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
      return { name: model.collection.name, fields: fields };
    });
};

