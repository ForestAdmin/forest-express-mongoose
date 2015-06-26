'use strict';
var ResourcesFinder = require('../services/resources-finder');
var ResourceFinder = require('../services/resource-finder');
var ResourceUpdater = require('../services/resource-updater');

module.exports = function (app, model, opts) {
  this.list = function (req, res, next) {
    new ResourcesFinder(model, opts)
      .perform()
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  };

  this.get = function (req, res, next) {
    new ResourceFinder(model, req.params)
      .perform()
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.create = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.update = function (req, res, next) {
    new ResourceUpdater(model, req.body)
      .perform()
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.remove = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.perform = function () {
    var modelName = model.collection.name;

    app.get('/forest/' + modelName, this.list);
    app.get('/forest/' + modelName + '/:recordId', this.get);
    app.post('/forest/' + modelName, this.create);
    app.patch('/forest/' + modelName + '/:recordId', this.update);
    app.delete('/forest/' + modelName + '/:recordId', this.remove);
  };
};
