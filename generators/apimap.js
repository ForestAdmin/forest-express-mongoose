'use strict';
var P = require('bluebird');
var JSONAPISerializer = require('jsonapi-serializer');
var SchemaAdapter = require('../adapters/mongoose');
var auth = require('../services/auth');

module.exports = function (app, models, opts) {
  function mapSeries(things, fn) {
    var results = [];
    return P.each(things, function (value, index, length) {
      var ret = fn(value, index, length);
      results.push(ret);
      return ret;
    }).thenReturn(results).all();
  }

  this.apiConfig = function (req, res, next) {
      mapSeries(models, function (model) {
        return new SchemaAdapter(model, opts);
      })
      .then(function (collections) {
        return new JSONAPISerializer('collections', collections, {
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
    app.get('/forest', auth.ensureAuthenticated, this.apiConfig);
  };
};
