'use strict';
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');
var Schemas = require('../generators/schemas');

function ResourceSerializer(model, records, opts, meta) {
  var schema = Schemas.schemas[model.collection.name];

  function hasStripeIntegration() {
    return opts.integrations && opts.integrations.stripe &&
      opts.integrations.stripe.apiKey;
  }

  if (hasStripeIntegration()) {
    // jshint camelcase: false
    if (_.isArray(records)) {
      records = records.map(function (record) {
        record.stripe_payments = [];
        record.stripe_invoices = [];
        record.stripe_cards = [];
        return record;
      });
    } else {
      records.stripe_payments = [];
      records.stripe_invoices = [];
      records.stripe_cards = [];
    }
  }

  function hasIntercomIntegration() {
    return opts.integrations && opts.integrations.intercom &&
      opts.integrations.intercom.apiKey && opts.integrations.intercom.appId;
  }

  if (hasStripeIntegration()) {
    // jshint camelcase: false
    if (_.isArray(records)) {
      records = records.map(function (record) {
        record.stripe_payments = [];
        record.stripe_invoices = [];
        record.stripe_cards = [];
        return record;
      });
    } else {
      records.stripe_payments = [];
      records.stripe_invoices = [];
      records.stripe_cards = [];
    }
  }

  if (hasIntercomIntegration()) {
    // jshint camelcase: false
    if (_.isArray(records)) {
      records = records.map(function (record) {
        record.intercom_conversations = [];
        record.intercom_attributes = [];
        return record;
      });
    } else {
      records.intercom_conversations = [];
      records.intercom_attributes = [];
    }
  }

  this.perform = function () {
    var typeForAttributes = {};

    function getAttributesFor(dest, fields) {
      _.map(fields, function (field) {
        if (hasIntercomIntegration() && ['intercom_conversations',
          'intercom_attributes'].indexOf(field.field) > -1) {
          dest[field.field] = {
            ref: '_id',
            attributes: [],
            included: false,
            ignoreRelationshipData: true,
            relationshipLinks: {
              related: function (dataSet) {
                var ret = {
                  href: '/forest/' + model.collection.name + '/' +
                    dataSet._id + '/' + field.field,
                };
                return ret;
              }
            }
          };
        } else if (hasStripeIntegration() && ['stripe_payments', 'stripe_invoices',
         'stripe_cards'].indexOf(field.field) > -1) {
          dest[field.field] = {
            ref: '_id',
            attributes: [],
            included: false,
            ignoreRelationshipData: true,
            relationshipLinks: {
              related: function (dataSet) {
                var ret = {
                  href: '/forest/' + model.collection.name + '/' +
                    dataSet._id + '/' + field.field,
                };
                return ret;
              }
            }
          };
        } else {
          if (_.isPlainObject(field.type)) {
            dest[field.field] = {
              attributes: _.map(field.type.fields, 'field')
            };

            getAttributesFor(dest[field.field], field.type.fields);
          } else if (field.reference) {
            var referenceType = typeForAttributes[field.field] =
              field.reference.substring(0, field.reference.length -
                '._id'.length);

            var referenceSchema = Schemas.schemas[referenceType];
            dest[field.field] = {
              ref: '_id',
              attributes: _.map(referenceSchema.fields, 'field'),
              relationshipLinks: {
                related: function (dataSet, relationship) {
                  var ret = {
                    href: '/forest/' + model.collection.name + '/' +
                      dataSet._id + '/' + field.field,
                  };

                  if (_.isArray(field.type)) {
                    ret.meta = { count: relationship.length || 0 };
                  }

                  return ret;
                }
              }
            };

            if (_.isArray(field.type)) {
              dest[field.field].ignoreRelationshipData = true;
              dest[field.field].included = false;
            }
          }
        }

      });
    }

    var serializationOptions = {
      id: '_id',
      attributes: _.map(schema.fields, 'field'),
      keyForAttribute: function (key) {
        return Inflector.underscore(key);
      },
      typeForAttribute: function (attribute) {
        return typeForAttributes[attribute] || attribute;
      },
      meta: meta
    };

    getAttributesFor(serializationOptions, schema.fields);

    return new JSONAPISerializer(schema.name, records,
      serializationOptions);
  };
}

module.exports = ResourceSerializer;
