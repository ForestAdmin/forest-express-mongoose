/* eslint global-require: 0 */
const P = require('bluebird');
const Interface = require('forest-express');
const utils = require('./utils/schema');
const orm = require('./utils/orm');
const Flattener = require('./services/flattener');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

exports.collection = Interface.collection;
exports.ensureAuthenticated = Interface.ensureAuthenticated;
exports.errorHandler = () => Interface.errorHandler({ logger: Interface.logger });
exports.StatSerializer = Interface.StatSerializer;
exports.ResourceSerializer = Interface.ResourceSerializer;

exports.PermissionMiddlewareCreator = Interface.PermissionMiddlewareCreator;
exports.deactivateCountMiddleware = Interface.deactivateCountMiddleware;
exports.RecordsCounter = Interface.RecordsCounter;
exports.RecordsExporter = Interface.RecordsExporter;
exports.RecordsGetter = Interface.RecordsGetter;
exports.RecordGetter = Interface.RecordGetter;
exports.RecordUpdater = Interface.RecordUpdater;
exports.RecordCreator = Interface.RecordCreator;
exports.RecordRemover = Interface.RecordRemover;
exports.RecordsRemover = Interface.RecordsRemover;
exports.RecordSerializer = Interface.RecordSerializer;
exports.requestUnflattener = Flattener.requestUnflattener;

exports.PUBLIC_ROUTES = Interface.PUBLIC_ROUTES;

exports.init = (opts) => {
  exports.opts = opts;

  if (!opts.objectMapping) {
    Interface.logger.error('The objectMapping option appears to be missing. Please make sure it is set correctly.');
    return Promise.resolve(() => {});
  }

  if (opts.mongoose) {
    Interface.logger.warn('The mongoose option is not supported anymore. Please remove this option.');
  }

  opts.Mongoose = opts.objectMapping;
  opts.useMultipleDatabases = Object.keys(opts.connections).length > 1;

  exports.getLianaName = () => 'forest-express-mongoose';

  exports.getLianaVersion = () => {
    const lianaVersion = require('../package.json').version.match(REGEX_VERSION);
    if (lianaVersion && lianaVersion[0]) {
      return lianaVersion[0];
    }
    return null;
  };

  exports.getOrmVersion = () => orm.getVersion(opts.Mongoose);

  exports.getDatabaseType = () => (opts.useMultipleDatabases ? 'multiple' : 'MongoDB');

  exports.SchemaAdapter = require('./adapters/mongoose');

  exports.getModelName = utils.getModelName;
  // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority
  exports.getModelNameOld = utils.getModelNameOld;

  exports.ResourcesGetter = require('./services/resources-getter');
  exports.ResourceGetter = require('./services/resource-getter');
  exports.ResourceCreator = require('./services/resource-creator');
  exports.ResourceUpdater = require('./services/resource-updater');
  exports.ResourceRemover = require('./services/resource-remover');
  exports.ResourcesExporter = require('./services/resources-exporter');
  exports.ResourcesRemover = require('./services/resources-remover');
  exports.EmbeddedDocumentUpdater = require('./services/embedded-document-updater');

  exports.HasManyGetter = require('./services/has-many-getter');
  exports.HasManyAssociator = require('./services/has-many-associator');
  exports.HasManyDissociator = require('./services/has-many-dissociator');
  exports.BelongsToUpdater = require('./services/belongs-to-updater');

  exports.ValueStatGetter = require('./services/value-stat-getter');
  exports.PieStatGetter = require('./services/pie-stat-getter');
  exports.LineStatGetter = require('./services/line-stat-getter');

  exports.RecordsDecorator = require('./utils/records-decorator');

  exports.Flattener = Flattener;

  exports.Stripe = {
    getCustomer(customerModel, customerField, customerId) {
      return new P((resolve, reject) => {
        if (customerId) {
          return customerModel
            .findById(customerId)
            .lean()
            .exec((err, customer) => {
              if (err) { return reject(err); }
              if (!customer || !customer[customerField]) { return reject(); }

              return resolve(customer);
            });
        }
        return resolve();
      });
    },
    getCustomerByUserField(customerModel, customerField, userField) {
      return new P((resolve, reject) => {
        if (!customerModel) { return resolve(null); }

        const query = {};
        query[customerField] = userField;

        return customerModel
          .findOne(query)
          .lean()
          .exec((err, customer) => {
            if (err) { return reject(err); }
            return resolve(customer);
          });
      });
    },
  };

  exports.Intercom = {
    getCustomer(userModel, customerId) {
      return new P((resolve, reject) => {
        if (customerId) {
          return userModel
            .findById(customerId)
            .lean()
            .exec((err, customer) => {
              if (err) { return reject(err); }
              if (!customer) { return reject(); }
              return resolve(customer);
            });
        }
        return resolve();
      });
    },
  };

  exports.Mixpanel = {
    getUser(userModel, userId) {
      if (userId) {
        return userModel
          .findById(userId)
          .then((user) => user.toJSON());
      }

      return P.resolve();
    },
  };

  exports.Layer = {
    getUser(customerModel, customerField, customerId) {
      return new P((resolve, reject) => {
        if (customerId) {
          return customerModel
            .findById(customerId)
            .lean()
            .exec((err, customer) => {
              if (err) { return reject(err); }
              if (!customer || !customer[customerField]) { return reject(); }

              return resolve(customer);
            });
        }
        return resolve();
      });
    },
  };

  return Interface.init(exports);
};
