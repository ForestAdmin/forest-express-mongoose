'use strict';
var P = require('bluebird');

function StripePaymentRefunder(params, opts) {
  var stripe = require('stripe')(opts.integrations.stripe.apiKey);

  function refund(chargeId) {
    return new P(function (resolve, reject) {
      stripe.refunds.create({
        charge: chargeId
      }, function (err) {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  this.perform = function () {
    return P.map(params.jsonapis, function (jsonapi) {
      return refund(jsonapi.data.id);
    });
  };
}

module.exports = StripePaymentRefunder;
