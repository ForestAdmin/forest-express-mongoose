'use strict';
var Inflector = require('inflected');
var auth = require('../services/auth');
var ValueStatFinder = require('../services/value-stat-finder');
var PieStatFinder = require('../services/pie-stat-finder');
var LineStatFinder = require('../services/line-stat-finder');
var StatSerializer = require('../serializers/stat');

module.exports = function (app, model, opts) {
  this.create = function (req, res, next) {
    var promise = null;

    switch (req.body.type) {
      case 'Value':
        promise = new ValueStatFinder(model, req.body, opts).perform();
        break;
      case 'Pie':
        promise = new PieStatFinder(model, req.body, opts).perform();
        break;
      case 'Line':
        promise = new LineStatFinder(model, req.body, opts).perform();
        break;
    }

    if (!promise) {
      return res.status(400).send({ error: 'Chart type not found.' });
    }

    promise
      .then(function (stat) {
        return new StatSerializer(stat).perform();
      })
      .then(function (stat) {
        res.send(stat);
      })
      .catch(next);
  };

  this.perform = function () {
    var modelName = Inflector.pluralize(model.modelName).toLowerCase();

    app.post('/forest/stats/' + modelName, auth.ensureAuthenticated,
      this.create);
  };
};
