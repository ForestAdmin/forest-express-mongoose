'use strict';
var P = require('bluebird');
var _ = require('lodash');
var express = require('express');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
var cors = require('express-cors');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var ResourcesRoutes = require('./routes/resources');
var AssociationsRoutes = require('./routes/associations');
var ApimapRoutes = require('./routes/apimap');
var StripeRoutes = require('./routes/stripe');
var Schemas = require('./generators/schemas');
var Serializers = require('./generators/serializers');

function requireAllModels(modelsDir, opts) {
  return fs.readdirAsync(modelsDir)
    .each(function (file) {
      try {
        require(path.join(modelsDir, file));
      } catch (e) { }
    })
    .then(function () {
      return _.values(opts.mongoose.models);
    });
}

exports.init = function (opts) {
  var app = express();

  app.use(cors({
    allowedOrigins: ['http://localhost:4200', 'https://www.forestadmin.com',
      'http://www.forestadmin.com'],
      headers: ['Authorization', 'X-Requested-With', 'Content-Type',
        'Stripe-Secret-Key', 'Stripe-Reference']
  }));

  app.use(bodyParser.json({type: 'application/vnd.api+json'}));

  app.use(jwt({
    secret: opts.jwtSigningKey,
    credentialsRequired: false
  }));

  var absModelDirs = path.resolve('.', opts.modelsDir);
  requireAllModels(absModelDirs, opts)
    .then(function (models) {
      return Schemas.perform(models, opts).thenReturn(models);
    })
    .then(function (models) {
      return Serializers.perform(models, opts).thenReturn(models);
    })
    .each(function (model) {
      new ResourcesRoutes(app, model, opts).perform();
      new AssociationsRoutes(app, model, opts).perform();
    })
    .then(function (models) {
      new StripeRoutes(app, opts).perform();
      return models;
    })
    .then(function (models) {
      return new ApimapRoutes(app, models, opts).perform();
    });


  return app;
};
