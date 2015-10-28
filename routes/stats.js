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

    var modelName = Inflector.camelize(
      Inflector.singularize(req.body.collection));

    var model = opts.mongoose.models[modelName];

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
    app.post('/forest/stats', auth.ensureAuthenticated,
      this.create);
  };
};
