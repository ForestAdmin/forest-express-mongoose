'use strict';
var _ = require('lodash');
var Inflector = require('inflected');
var StripePaymentsFinder = require('../services/stripe-payments-finder');
var StripePaymentsSerializer = require('../serializers/stripe-payments');
var StripePaymentRefunder = require('../services/stripe-payment-refunder');
var StripeInvoicesFinder = require('../services/stripe-invoices-finder');
var StripeInvoicesSerializer = require('../serializers/stripe-invoices');
var StripeCardsFinder = require('../services/stripe-cards-finder');
var StripeCardsSerializer = require('../serializers/stripe-cards');
var auth = require('../services/auth');

module.exports = function (app, model, opts) {
  var modelName = Inflector.pluralize(model.modelName).toLowerCase();

  this.stripePayments = function (req, res, next) {
    new StripePaymentsFinder(_.extend(req.query, req.params), opts)
      .perform()
      .spread(function (count, payments) {
        return new StripePaymentsSerializer(payments, modelName, {
          count: count
        });
      })
      .then(function (payments) {
        res.send(payments);
      })
      .catch(next);
  };

  this.stripeRefund = function (req, res, next) {
    new StripePaymentRefunder(req.body, opts)
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
    new StripeInvoicesFinder(_.extend(req.query, req.params), opts)
      .perform()
      .spread(function (count, invoices) {
        return new StripeInvoicesSerializer(invoices, modelName, {
          count: count
        });
      })
      .then(function (invoices) {
        res.send(invoices);
      })
      .catch(next);
  };

  this.stripeCards = function (req, res, next) {
    new StripeCardsFinder(_.extend(req.query, req.params), opts)
      .perform()
      .spread(function (count, cards) {
        return new StripeCardsSerializer(cards, modelName, { count: count });
      })
      .then(function (cards) {
        res.send(cards);
      })
      .catch(next);
  };

  this.perform = function () {
    app.get('/forest/stripe_payments', auth.ensureAuthenticated,
      this.stripePayments);

    app.get('/forest/' + modelName + '/:recordId/stripe_payments',
      auth.ensureAuthenticated, this.stripePayments);

    app.post('/forest/stripe_payments/refunds', auth.ensureAuthenticated,
      this.stripeRefund);

    app.get('/forest/stripe_invoices', auth.ensureAuthenticated,
      this.stripeInvoices);

    app.get('/forest/' + modelName + '/:recordId/stripe_invoices',
      auth.ensureAuthenticated, this.stripeInvoices);

    app.get('/forest/' + modelName + '/:recordId/stripe_cards',
      auth.ensureAuthenticated, this.stripeCards);
  };
};
