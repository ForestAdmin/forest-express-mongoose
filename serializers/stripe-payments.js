'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');
var Schemas = require('../generators/schemas');

function StripePaymentsSerializer(payments, customerCollectionName, meta) {
  function getCustomerAttributes() {
    if (!payments.length) { return []; }

    var schema = Schemas.schemas[customerCollectionName];
    if (!schema) { return []; }
    return _.map(schema.fields, 'field');
  }

  var customerAttributes = getCustomerAttributes();

  payments = payments.map(function (payment) {
    if (payment.customer) {
      payment.customer = payment.customer.toJSON();
      payment.customer.id = payment.customer._id;
    }

    if (payment.created) {
      payment.created =  new Date(payment.created * 1000);
    }

    if (payment.amount) { payment.amount /= 100; }

    return payment;
  });

  return new JSONAPISerializer('stripe-payments', payments, {
    attributes: ['created', 'status', 'amount', 'currency', 'refunded',
      'customer', 'description'],
    customer: {
      ref: 'id',
      attributes: customerAttributes
    },
    keyForAttribute: function (key) {
      return Inflector.underscore(key);
    },
    typeForAttribute: function (attr) {
      if (attr === 'customer') { return customerCollectionName; }
      return attr;
    },
    meta: meta
  });
}

module.exports = StripePaymentsSerializer;
