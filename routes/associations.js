'use strict';
var _ = require('lodash');
var Inflector = require('inflected');
var auth = require('../services/auth');
var HasManyFinder = require('../services/has-many-finder');
var ResourceSerializer = require('../serializers/resource');
var Schemas = require('../generators/schemas');

module.exports = function (app, model, opts) {

  function getAssociationModel(associationName) {
    var schema = Schemas.schemas[model.collection.name];
    var field = _.findWhere(schema.fields, { field: associationName });
    if (field && field.reference) {
      var referenceName = field.reference.split('.')[0];
      return Inflector.camelize(Inflector.singularize(referenceName));
    }
  }

  function index(req, res, next) {
    var params = _.extend(req.query, req.params);
    var associationModel = opts.mongoose.models[
      getAssociationModel(req.params.associationName)];

    return new HasManyFinder(model, associationModel, opts, params)
      .perform()
      .spread(function (count, records) {
        return new ResourceSerializer(associationModel, records, opts, {
          count: count
        }).perform();
      })
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  }

  this.perform = function () {
    var modelName = Inflector.pluralize(model.modelName).toLowerCase();

    app.get('/forest/' + modelName + '/:recordId/:associationName',
      auth.ensureAuthenticated, index);
  };
};

