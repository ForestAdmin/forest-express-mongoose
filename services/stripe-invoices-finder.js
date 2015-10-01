'use strict';
var P = require('bluebird');
var StripeReferenceFinder = require('./stripe-reference-finder');
var StripeUtils = require('../utils/stripe');

function StripeInvoicesFinder(secretKey, reference, params, opts) {
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

  function getInvoices(query) {
    return new P(function (resolve, reject) {
      if (customer) {
        query.customer = customer[StripeUtils.getReferenceField(reference)];
        if (!query.customer) { return resolve([0, []]); }
      }

      stripe.invoices.list(query, function (err, invoices) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([invoices.total_count, invoices.data]);
      });
    });
  }

  function getCustomer(customerId) {
    return new P(function (resolve, reject) {
      var query = {};
      var Model = StripeUtils.getReferenceModel(opts.mongoose, reference);
      var referenceField = StripeUtils.getReferenceField(reference);

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
          'include[]': 'total_count'
        };

        return getInvoices(query);
      })
      .spread(function (count, invoices) {
        return P
          .map(invoices, function (invoice) {
            return getCustomer(invoice.customer)
              .then(function (customer) {
                invoice.customer = customer;
                return invoice;
              });
          })
          .then(function (invoices) {
            return [count, invoices];
          });
      });
  };
}

module.exports = StripeInvoicesFinder;
