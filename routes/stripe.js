'use strict';
var StripePaymentsFinder = require('../services/stripe-payments-finder');
var StripePaymentsSerializer = require('../serializers/stripe-payments');
var StripePaymentRefunder = require('../services/stripe-payment-refunder');
var StripeInvoicesFinder = require('../services/stripe-invoices-finder');
var StripeInvoicesSerializer = require('../serializers/stripe-invoices');
var StripeCardsFinder = require('../services/stripe-cards-finder');
var StripeCardsSerializer = require('../serializers/stripe-cards');
var SchemaUtils = require('../utils/schema');
var auth = require('../services/auth');

module.exports = function (app, opts) {
  this.stripePayments = function (req, res, next) {
    new StripePaymentsFinder(req.headers['stripe-secret-key'],
      req.headers['stripe-reference'], req.query, opts)
      .perform()
      .spread(function (count, payments) {
        var customerCollectionName = SchemaUtils.getReferenceCollectionName(
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
        var customerCollectionName = SchemaUtils.getReferenceCollectionName(
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
        var customerCollectionName = SchemaUtils.getReferenceCollectionName(
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
