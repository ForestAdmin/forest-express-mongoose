'use strict';
var _ = require('lodash');

module.exports = {
  getReference: function(opts) {
    if (opts && opts.options) {
      if (opts.options.ref) {
        return opts.options.ref;
      } else if (_.isArray(opts.options.type) && opts.options.type.length &&
        opts.options.type[0].ref) {
        return opts.options.type[0].ref;
      }
    }
  },
  getModels : function(opts) {
    // Return normal list when options don't contradict it
    if (_.isEmpty(opts.includedModels) && _.isEmpty(opts.excludedModels)) {
      return opts.mongoose.models;
    }
    // Initially opts.mongoose.models is indexed by modelName
    // so we filter (which gives us an array)
    // then we re-index by modelName
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
    return models
      .indexBy('modelName')
      .value();
  }
};
