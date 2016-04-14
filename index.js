'use strict';
var P = require('bluebird');
var Interface = require('forest-express');

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;

exports.init = function(opts) {
  exports.opts = opts;

  exports.SchemaAdapter = require('./adapters/mongoose');

  exports.getModels = function () {
    return opts.mongoose.models;
  };

  exports.getModelName = function (model) {
    return model.modelName;
  };

  exports.ResourcesGetter = require('./services/resources-getter');
  exports.ResourceGetter = require('./services/resource-getter');
  exports.ResourceCreator = require('./services/resource-creator');
  exports.ResourceUpdater = require('./services/resource-updater');
  exports.ResourceRemover = require('./services/resource-remover');

  exports.HasManyGetter = require('./services/has-many-getter');

  exports.ValueStatGetter = require('./services/value-stat-getter');
  exports.PieStatGetter = require('./services/pie-stat-getter');
  exports.LineStatGetter = require('./services/line-stat-getter');

  exports.Stripe = {
    getCustomer: function (customerModel, customerId, userField) {
      return new P(function (resolve, reject) {
        if (customerId) {
          return customerModel
            .findById(customerId)
            .lean()
            .exec(function (err, customer) {
              if (err) { return reject(err); }
              if (!customer || !customer[userField]) { return reject(); }

              resolve(customer);
            });
        } else {
          resolve();
        }
      });
    },
    getCustomerByUserField: function (customerModel, userField) {
      return new P(function (resolve, reject) {
        if (!customerModel) { return resolve(null); }

        var query = {};
        query[opts.integrations.stripe.userField] = userField;

        customerModel
          .findOne(query)
          .lean()
          .exec(function (err, customer) {
            if (err) { return reject(err); }
            resolve(customer);
          });
      });
    }
  };

  exports.Intercom = {
    getCustomer: function (userModel, customerId) {
      return new P(function (resolve, reject) {
        if (customerId) {
          return userModel
          .findById(customerId)
          .lean()
          .exec(function (err, customer) {
            if (err) { return reject(err); }
            if (!customer) { return reject(); }
            resolve(customer);
          });
        } else {
          resolve();
        }
      });
    }
  };

  return Interface.init(exports);
};
