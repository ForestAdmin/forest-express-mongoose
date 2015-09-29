'use strict';
var P = require('bluebird');

function StripePaymentsFinder(secretKey) {
  var stripe = require('stripe')(secretKey);

  this.perform = function () {
    return new P(function (resolve, reject) {
      stripe.charges.list({ limit: 10 }, function (err, charges) {
        if (err) { return reject(err); }
        resolve(charges.data);
      });
    });
  };
}

module.exports = StripePaymentsFinder;
