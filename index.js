'use strict';
var P = require('bluebird');
var _ = require('lodash');
var express = require('express');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
var cors = require('express-cors');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var ApiGenerator = require('./generators/api-generator');
var ConfigGenerator = require('./generators/config-generator');

function requireAllModels(modelsDir, opts) {
  return fs.readdirAsync(modelsDir)
    .each(function (file) {
      require(path.join(modelsDir, file));
    })
    .then(function () {
      return _.values(opts.mongoose.models);
    });
}

exports.init = function (opts) {
  var app = express();

  app.use(cors({
    allowedOrigins: [ 'http://localhost:4200' ],
      headers: ['Authorization', 'X-Requested-With', 'Content-Type']
  }));

  app.use(bodyParser.json({type: 'application/vnd.api+json'}));

  app.use(jwt({
    secret: opts.jwtSigningKey
  }));

  var absModelDirs = path.resolve('.', opts.modelsDir);
  requireAllModels(absModelDirs, opts)
    .each(function (model) {
      return new ApiGenerator(app, model, opts).perform();
    })
    .then(function (models) {
      return new ConfigGenerator(app, models, opts).perform();
    });


  return app;
};
