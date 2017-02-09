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
    // then we re-index by modelName)
    return _.chain(opts.mongoose.models)
      .filter(function (model, modelName) {
        if (!_.isEmpty(opts.includedModels)) {
          return _.includes(opts.includedModels, modelName);
        } else {
          return !_.includes(opts.excludedModels, modelName);
        }
      })
      .indexBy('modelName')
      .value();
  }
};
