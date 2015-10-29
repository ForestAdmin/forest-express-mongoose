'use strict';
var P = require('bluebird');
var StripeReferenceFinder = require('./stripe-reference-finder');
var SchemaUtils = require('../utils/schema');

function StripePaymentsFinder(secretKey, reference, params, opts) {
  var stripe = require('stripe')(secretKey);
  var customer = null;

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    } else {
      return 10;
    }
  }

  function getOffset() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  function getCharges(query) {
    return new P(function (resolve, reject) {
      if (customer) {
        query.customer = customer[SchemaUtils.getReferenceField(reference)];
        if (!query.customer) { return resolve([0, []]); }
      }

      stripe.charges.list(query, function (err, charges) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([charges.total_count, charges.data]);
      });
    });
  }

  function getCustomer(customerId) {
    return new P(function (resolve, reject) {
      var query = {};
      var Model = SchemaUtils.getReferenceModel(opts.mongoose, reference);
      var referenceField = SchemaUtils.getReferenceField(reference);

      if (!Model) { return resolve(null); }

      query[referenceField] = customerId;
      Model
        .findOne(query)
        .exec(function (err, customer) {
          if (err) { return reject(err); }
          resolve(customer);
        });
    });
  }

  this.perform = function () {
    return new StripeReferenceFinder(secretKey, reference, params, opts)
      .perform()
      .then(function (lCustomer) {
        customer = lCustomer;

        var query = {
          limit: getLimit(),
          offset: getOffset(),
          source: { object: 'card' },
          'include[]': 'total_count'
        };

        return getCharges(query);
      })
      .spread(function (count, payments) {
        return P
          .map(payments, function (payment) {
            return getCustomer(payment.customer)
              .then(function (customer) {
                payment.customer = customer;
                return payment;
              });
          })
          .then(function (payments) {
            return [count, payments];
          });
      });
  };
}

module.exports = StripePaymentsFinder;
