'use strict';
var ResourcesFinder = require('../services/resources-finder');
var ResourceFinder = require('../services/resource-finder');
var ResourceUpdater = require('../services/resource-updater');
var ResourceSerializer = require('../serializers/resource');
var ResourceDeserializer = require('../deserializers/resource');

module.exports = function (app, model, opts) {
  this.list = function (req, res, next) {
    new ResourcesFinder(model, opts, req.query)
      .perform()
      .spread(function (count, records) {
        return new ResourceSerializer(model, records, opts, { count: count })
          .perform();
      })
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  };

  this.get = function (req, res, next) {
    new ResourceFinder(model, req.params)
      .perform()
      .then(function (record) {
        return new ResourceSerializer(model, record, opts).perform();
      })
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.create = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.update = function (req, res, next) {
    new ResourceDeserializer(model, req.body, opts)
      .perform()
      .then(function (params) {
        new ResourceUpdater(model, params)
          .perform()
          .then(function (record) {
            return new ResourceSerializer(model, record, opts).perform();
          })
          .then(function (record) {
            res.send(record);
          })
          .catch(next);
      });
  };

  this.remove = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.perform = function () {
    var modelName = model.collection.name;

    app.get('/forest/' + modelName, this.list);
    app.get('/forest/' + modelName + '/:recordId', this.get);
    app.post('/forest/' + modelName, this.create);
    app.put('/forest/' + modelName + '/:recordId', this.update);
    app.delete('/forest/' + modelName + '/:recordId', this.remove);
  };
};
