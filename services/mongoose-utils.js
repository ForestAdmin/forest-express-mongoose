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
    if (_.isEmpty(opts.includedModels) && _.isEmpty(opts.excludedModels)) {
      return opts.mongoose.models;
    }

    var models = _.chain(opts.mongoose.models);
    if (!_.isEmpty(opts.includedModels)) {
      models = models.filter(function (model, modelName) {
        return _.includes(opts.includedModels, modelName);
      });
    } else {
      models = models.filter(function (model, modelName) {
        return !_.includes(opts.excludedModels, modelName);
      });
    }

    return models.indexBy('modelName').value();
  }
};
