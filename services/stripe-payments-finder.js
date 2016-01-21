'use strict';
var P = require('bluebird');

function StripePaymentsFinder(params, opts) {
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

  function getCharges(query) {
    return new P(function (resolve, reject) {
      stripe.charges.list(query, function (err, charges) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([charges.total_count, charges.data]);
      });
    });
  }

  function getCustomer(customerId, userField) {
    return new P(function (resolve, reject) {
      if (customerId) {
        return customerModel
          .findById(customerId)
          .lean()
          .exec(function (err, customer) {
            if (err) { return reject(err); }
            if (!customer || !customer[userField]) { return reject(); }

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

    return getCustomer(params.recordId, userField)
      .then(function (customer) {
        var query = {
          limit: getLimit(),
          offset: getOffset(),
          source: { object: 'card' },
          'include[]': 'total_count'
        };

        if (customer) { query.customer = customer[userField]; }

        return getCharges(query)
          .spread(function (count, payments) {
            return P
              .map(payments, function (payment) {
                if (customer) {
                  payment.customer = customer;
                } else {
                  return getCustomerByUserField(payment.customer)
                    .then(function (customer) {
                      payment.customer = customer;
                      return payment;
                    });
                }
                return payment;
              })
              .then(function (payments) {
                return [count, payments];
              });
          });
      }, function () {
        return new P(function (resolve) { resolve([0, []]); });
      });
  };
}

module.exports = StripePaymentsFinder;
