const _ = require('lodash');

module.exports = {
  getReference(opts) {
    if (opts && opts.options) {
      if (opts.options.ref) {
        return opts.options.ref;
      }
      if (_.isArray(opts.options.type) && opts.options.type.length
        && opts.options.type[0].ref) {
        return opts.options.type[0].ref;
      }
    }
    return null;
  },
  getModels(opts) {
    // NOTICE: By default return all detected models
    const detectAllModels = _.isEmpty(opts.includedModels)
      && _.isEmpty(opts.excludedModels);
    const models = {};

    _.each(opts.connections, (connection) => {
      _.each(connection.models, (model) => {
        if (detectAllModels) {
          models[model.modelName] = model;
        } else if (!_.isEmpty(opts.includedModels)
          && _.includes(opts.includedModels, model.modelName)) {
          models[model.modelName] = model;
        } else if (!_.isEmpty(opts.excludedModels)
          && !_.includes(opts.excludedModels, model.modelName)) {
          models[model.modelName] = model;
        }
      });
    });

    return models;
  },
};
