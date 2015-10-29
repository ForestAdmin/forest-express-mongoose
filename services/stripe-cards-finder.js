'use strict';
var P = require('bluebird');
var StripeReferenceFinder = require('./stripe-reference-finder');
var SchemaUtils = require('../utils/schema');

function StripeCardsFinder(secretKey, reference, params, opts) {
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

  function getCards(customer, query) {
    return new P(function (resolve, reject) {
      if (!customer) { return resolve([0, []]); }

      stripe.customers.listCards(customer, query, function (err, cards) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([cards.total_count, cards.data]);
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
        var referenceField = SchemaUtils.getReferenceField(reference);

        var query = {
          limit: getLimit(),
          offset: getOffset(),
          'include[]': 'total_count'
        };

        return getCards(customer[referenceField], query);
      })
      .spread(function (count, cards) {
        return P
          .map(cards, function (card) {
            return getCustomer(card.customer)
              .then(function (customer) {
                card.customer = customer;
                return card;
              });
          })
          .then(function (cards) {
            return [count, cards];
          });
      });
  };
}

module.exports = StripeCardsFinder;
