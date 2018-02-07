'use strict';
var _ = require('lodash');

module.exports = {
  getReference: function (opts) {
    if (opts && opts.options) {
      if (opts.options.ref) {
        return opts.options.ref;
      } else if (_.isArray(opts.options.type) && opts.options.type.length &&
        opts.options.type[0].ref) {
        return opts.options.type[0].ref;
      }
    }
  },
  getModels: function (opts) {
    // NOTICE: By default return all detected models
    var detectAllModels = _.isEmpty(opts.includedModels) &&
      _.isEmpty(opts.excludedModels);
    var models = {};

    _.each(opts.connections, function (connection) {
      _.each(connection.models, function (model) {
        if (detectAllModels) {
          models[model.modelName] = model;
        } else {
          if (!_.isEmpty(opts.includedModels) &&
            _.includes(opts.includedModels, model.modelName)) {
            models[model.modelName] = model;
          } else if (!_.includes(opts.excludedModels, model.modelName)) {
            models[model.modelName] = model;
          }
        }
      });
    });

    return models;
  }
};
