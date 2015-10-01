'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');
var Schemas = require('../generators/schemas');

function StripeCardsSerializer(cards, customerCollectionName, meta) {

  function getCustomerAttributes() {
    if (!cards.length) { return []; }

    var schema = Schemas.schemas[cards[0].customer.collection.name];
    return _.map(schema.fields, 'field');
  }

  var customerAttributes = getCustomerAttributes();

  cards = cards.map(function (card) {
    card.customer = card.customer.toJSON();
    card.customer.id = card.customer._id;
    return card;
  });

  return new JSONAPISerializer('stripe-cards', cards, {
    attributes: ['last4', 'brand', 'funding', 'exp_month', 'exp_year',
      'country', 'name', 'address_line1', 'address_line2', 'address_city',
      'address_state', 'address_zip', 'address_country', 'cvc_check',
      'customer'],
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

module.exports = StripeCardsSerializer;
