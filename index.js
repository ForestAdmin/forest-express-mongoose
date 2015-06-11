'use strict';
var P = require('bluebird');
var express = require('express');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
var cors = require('express-cors');
var jwt = require('express-jwt');
var ApiGenerator = require('./generators/api-generator');
var ConfigGenerator = require('./generators/config-generator');

function requireAllModels(modelsDir) {
  return fs.readdirAsync(modelsDir)
    .map(function (file) {
      return require(path.join(modelsDir, file));
    });
}

exports.init = function (opts) {
  var app = express();
  app.use(cors({
    allowedOrigins: [ 'http://localhost:4200' ],
      headers: ['Authorization', 'X-Requested-With', 'Content-Type']
  }));

  app.use(jwt({
    secret: opts.jwtSigningKey
  }));

  var absModelDirs = path.resolve('.', opts.modelsDir);
  requireAllModels(absModelDirs)
    .each(function (model) {
      return new ApiGenerator(app, model, opts).perform();
    })
    .then(function (models) {
      return new ConfigGenerator(app, models, opts).perform();
    });


  return app;
};
