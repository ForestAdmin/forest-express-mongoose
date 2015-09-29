'use strict';
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');

function StripePaymentsSerializer(payments) {
  payments = payments.map(function (payment) {
    payment.created =  new Date(payment.created * 1000);
    return payment;
  });

  return new JSONAPISerializer('stripe-payments', payments, {
    attributes: ['created', 'status', 'amount', 'currency', 'refunded',
      'customer', 'description'],
    keyForAttribute: function (key) {
      return Inflector.underscore(key);
    }
  });
}

module.exports = StripePaymentsSerializer;
