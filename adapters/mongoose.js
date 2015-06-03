'use strict';
var P = require('bluebird');
var flat = require('flat');
var _ = require('lodash');

module.exports = function (model) {
  var fields = [];
  var paths = flat.unflatten(model.schema.paths);

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

  function getTypeFromNative(type) {
    if (type instanceof Array) {
      return [getTypeFromNative(type[0])];
    } else if (_.isPlainObject(type)) {
      return objectType(type, function (key) {
        return getTypeFromNative(type[key]);
      });
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
        return [objectType(opts.options.type[0], function (key) {
          return getTypeFromNative(opts.options.type[0][key]);
        })];
      }
    } else {
      // Deal with ObjectID
      if (opts.instance === 'ObjectID') { return 'String'; }

      // Deal with primitive type
      return opts.instance || getTypeFromNative(opts.options.type);
    }
  }

  function getSchema(path) {
    var opts = paths[path];

    var schema = {
      field: path,
      type: getTypeFromMongoose(paths[path]),
      isRequired: !!opts.isRequired
    };

    if (opts.enumValues && opts.enumValues.length) {
      schema.enumValues = opts.enumValues;
    }

    return schema;
  }

  return P
    .each(Object.keys(paths), function (path) {
      var schema = getSchema(path);
      schema.collectionName = model.collection.name;
      fields.push(schema);
    })
    .then(function () {
      return { name: model.collection.name, fields: fields };
    });
};

