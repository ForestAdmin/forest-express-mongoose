'use strict';
var P = require('bluebird');

function StripeCardsFinder(params, opts) {
  var stripe = require('stripe')(opts.integrations.stripe.apiKey);
  var customerModel = null;

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
      if (customerId) {
        return customerModel
          .findById(customerId)
          .lean()
          .exec(function (err, customer) {
            if (err) { return reject(err); }
            resolve(customer);
          });
      } else {
        resolve();
      }
    });
  }

  function getCustomerByUserField(userField) {
    return new P(function (resolve, reject) {
      if (!customerModel) { return resolve(null); }

      var query = {};
      query[opts.integrations.stripe.userField] = userField;

      customerModel
        .findOne(query)
        .lean()
        .exec(function (err, customer) {
          if (err) { return reject(err); }
          resolve(customer);
        });
    });
  }

  this.perform = function () {
    var userCollectionName = opts.integrations.stripe.userCollection;
    var userField = opts.integrations.stripe.userField;
    customerModel = opts.mongoose.model(userCollectionName);

    return getCustomer(params.recordId)
      .then(function (customer) {
        var query = {
          limit: getLimit(),
          offset: getOffset(),
          'include[]': 'total_count'
        };

        return getCards(customer[userField], query)
          .spread(function (count, cards) {
            return P
              .map(cards, function (card) {
                return getCustomerByUserField(card.customer)
                  .then(function (customer) {
                    card.customer = customer;
                    return card;
                  });
              })
              .then(function (cards) {
                return [count, cards];
              });
          });
      });
  };
}

module.exports = StripeCardsFinder;
