'use strict';
var P = require('bluebird');
var JSONAPISerializer = require('jsonapi-serializer');
var SchemaAdapter = require('../adapters/mongoose');

module.exports = function (app, models, opts) {
  this.apiConfig = function (req, res, next) {
    P
      .map(models, function (model) {
        return new SchemaAdapter(model, opts);
      })
      .then(function (collections) {
        return new JSONAPISerializer('collections', collections, {
          apiEndpoint: opts.apiEndpoint + '/forestapi',
          apiEndpointValue: opts.apiEndpoint + '/forestapi',
          id: 'name',
          attributes: ['name', 'fields'],
          fields: {
            attributes: ['field', 'type', 'collection_name']
          }
        });
      })
      .then(function (json) {
        res.send(json);
      })
      .catch(next);
  };

  this.perform = function () {
    app.get('/forestapi', this.apiConfig);
  };
};
