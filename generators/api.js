'use strict';
var Inflector = require('inflected');
var ResourcesFinder = require('../services/resources-finder');
var ResourceFinder = require('../services/resource-finder');
var ResourceCreator = require('../services/resource-creator');
var ResourceUpdater = require('../services/resource-updater');
var ResourceRemover = require('../services/resource-remover');
var ResourceSerializer = require('../serializers/resource');
var ResourceDeserializer = require('../deserializers/resource');
var StripePaymentsFinder = require('../services/stripe-payments-finder');
var StripePaymentsSerializer = require('../serializers/stripe-payments');
var StripePaymentRefunder = require('../services/stripe-payment-refunder');
var StripeInvoicesFinder = require('../services/stripe-invoices-finder');
var StripeInvoicesSerializer = require('../serializers/stripe-invoices');
var StripeCardsFinder = require('../services/stripe-cards-finder');
var StripeCardsSerializer = require('../serializers/stripe-cards');
var StripeUtils = require('../utils/stripe');
var auth = require('../services/auth');

module.exports = function (app, model, opts) {
  this.list = function (req, res, next) {
    return new ResourcesFinder(model, opts, req.query)
      .perform()
      .spread(function (count, records) {
        return new ResourceSerializer(model, records, opts, {
          count: count
        }).perform();
      })
      .then(function (records) {
        res.send(records);
      })
      .catch(next);
  };

  this.get = function (req, res, next) {
    return new ResourceFinder(model, req.params)
      .perform()
      .then(function (record) {
        return new ResourceSerializer(model, record, opts)
          .perform();
      })
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.create = function (req, res, next) {
    new ResourceDeserializer(model, req.body)
      .perform()
      .then(function (params) {
        return new ResourceCreator(model, params).perform();
      })
      .then(function (record) {
        return new ResourceSerializer(model, record, opts)
          .perform();
      })
      .then(function (record) {
        res.send(record);
      })
      .catch(next);
  };

  this.update = function (req, res, next) {
    new ResourceDeserializer(model, req.body)
      .perform()
      .then(function (params) {
        new ResourceUpdater(model, params)
          .perform()
          .then(function (record) {
            return new ResourceSerializer(model, record, opts)
              .perform();
          })
          .then(function (record) {
            res.send(record);
          })
          .catch(next);
      });
  };

  this.remove = function (req, res, next) {
    new ResourceRemover(model, req.params)
      .perform()
      .then(function () {
        res.status(204).send();
      })
      .catch(next);
  };

  this.stripePayments = function (req, res, next) {
    new StripePaymentsFinder(req.headers['stripe-secret-key'],
      req.headers['stripe-reference'], req.query, opts)
      .perform()
      .spread(function (count, payments) {
        var customerCollectionName = StripeUtils.getReferenceCollectionName(
          req.headers['stripe-reference']);

        return new StripePaymentsSerializer(payments, customerCollectionName, {
          count: count
        });
      })
      .then(function (payments) {
        res.send(payments);
      })
      .catch(next);
  };

  this.stripeRefund = function (req, res, next) {
    new StripePaymentRefunder(req.body)
      .perform()
      .then(function () {
        res.status(204).send();
      })
      .catch(function (err) {
        if (err.type === 'StripeInvalidRequestError') {
          res.status(400).send({ error: err.message });
        } else {
          next(err);
        }
      });
  };

  this.stripeInvoices = function (req, res, next) {
    new StripeInvoicesFinder(req.headers['stripe-secret-key'],
      req.headers['stripe-reference'], req.query, opts)
      .perform()
      .spread(function (count, invoices) {
        var customerCollectionName = StripeUtils.getReferenceCollectionName(
          req.headers['stripe-reference']);

        return new StripeInvoicesSerializer(invoices, customerCollectionName, {
          count: count
        });
      })
      .then(function (invoices) {
        res.send(invoices);
      })
      .catch(next);
  };

  this.stripeCards = function (req, res, next) {
    new StripeCardsFinder(req.headers['stripe-secret-key'],
      req.headers['stripe-reference'], req.query, opts)
      .perform()
      .spread(function (count, cards) {
        var customerCollectionName = StripeUtils.getReferenceCollectionName(
          req.headers['stripe-reference']);

        return new StripeCardsSerializer(cards, customerCollectionName, {
          count: count
        });
      })
      .then(function (cards) {
        res.send(cards);
      })
      .catch(next);
  };

  this.perform = function () {
    var modelName = Inflector.pluralize(model.modelName).toLowerCase();

    app.get('/forest/' + modelName, auth.ensureAuthenticated, this.list);

    app.get('/forest/' + modelName + '/:recordId', auth.ensureAuthenticated,
      this.get);

    app.post('/forest/' + modelName, auth.ensureAuthenticated,
      this.create);

    app.put('/forest/' + modelName + '/:recordId', auth.ensureAuthenticated,
      this.update);

    app.delete('/forest/' + modelName + '/:recordId', auth.ensureAuthenticated,
      this.remove);

    app.get('/forest/stripe_payments', auth.ensureAuthenticated,
      this.stripePayments);

    app.post('/forest/stripe_payments/refunds', auth.ensureAuthenticated,
      this.stripeRefund);

    app.get('/forest/stripe_invoices', auth.ensureAuthenticated,
      this.stripeInvoices);

    app.get('/forest/stripe_cards', auth.ensureAuthenticated,
      this.stripeCards);
  };
};
