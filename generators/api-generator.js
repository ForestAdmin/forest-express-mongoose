'use strict';
var ResourceFinder = require('../services/resource-finder');

module.exports = function (app, model, opts) {

  this.list = function (req, res, next) {
    new ResourceFinder(model, opts)
      .perform()
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  };

  this.get = function (req, res, next) {
    model
      .findById(req.params.recordId)
      .then(function(record) {
        res.send(record);
      })
      .catch(next);
  };

  this.create = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.update = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.remove = function (req, res, next) {
    next(new Error('Not implemented yet.'));
  };

  this.perform = function () {
    var modelName = model.collection.name;

    app.get('/forestapi/' + modelName, this.list);
    app.get('/forestapi/' + modelName + '/:recordId', this.get);
    app.post('/forestapi/' + modelName, this.create);
    app.put('/forestapi/' + modelName + '/:recordId', this.update);
    app.delete('/forestapi/' + modelName + '/:recordId',
      this.remove);
  };
};
