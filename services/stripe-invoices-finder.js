'use strict';
var P = require('bluebird');

function StripeInvoicesFinder(params, opts) {
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

  function getInvoices(query) {
    return new P(function (resolve, reject) {
      stripe.invoices.list(query, function (err, invoices) {
        if (err) { return reject(err); }
        // jshint camelcase: false
        resolve([invoices.total_count, invoices.data]);
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

        if (customer) { query.customer = customer[userField]; }

        return getInvoices(query)
          .spread(function (count, invoices) {
              return P
                .map(invoices, function (invoice) {
                  if (customer) {
                    invoice.customer = customer;
                  } else {
                    return getCustomerByUserField(invoice.customer)
                      .then(function (customer) {
                        invoice.customer = customer;
                        return invoice;
                      });
                  }
                  return invoice;
                })
                .then(function (invoices) {
                  return [count, invoices];
                });
            });
      });
  };
}

module.exports = StripeInvoicesFinder;
