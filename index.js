'use strict';
var P = require('bluebird');
var _ = require('lodash');
var express = require('express');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
var cors = require('express-cors');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var ResourcesRoutes = require('./routes/resources');
var AssociationsRoutes = require('./routes/associations');
var StripeRoutes = require('./routes/stripe');
var IntercomRoutes = require('./routes/intercom');
var StatRoutes = require('./routes/stats');
var Schemas = require('./generators/schemas');
var JSONAPISerializer = require('jsonapi-serializer');
var request = require('superagent');
var logger = require('./services/logger');

function requireAllModels(modelsDir, opts) {
  return fs.readdirAsync(modelsDir)
    .each(function (file) {
      try {
        require(path.join(modelsDir, file));
      } catch (e) { }
    })
    .then(function () {
      return _.values(opts.mongoose.models);
    });
}

exports.init = function (opts) {
  function hasStripeIntegration() {
    return opts.integrations && opts.integrations.stripe &&
      opts.integrations.stripe.apiKey;
  }

  function setupStripeIntegration(apimap) {
    // jshint camelcase: false
    var Model = opts.mongoose.model(opts.integrations.stripe.userCollection);
    var referenceName = Model.collection.collectionName + '.id';

    apimap.push({
      name: 'stripe_payments',
      isVirtual: true,
      isReadOnly: true,
      fields: [
        { field: 'id', type: 'String', isSearchable: false },
        { field: 'created', type: 'Date', isSearchable: false },
        { field: 'amount', type: 'Number', isSearchable: false },
        { field: 'status', type: 'String', isSearchable: false },
        { field: 'currency', type: 'String', isSearchable: false },
        { field: 'refunded', type: 'Boolean', isSearchable: false },
        { field: 'description', type: 'String', isSearchable: false },
        {
          field: 'customer',
          type: 'String',
          reference: referenceName,
          'isSearchable': false
        }
      ],
      actions: [{
        name: 'Refund',
        endpoint: '/forest/stripe_payments/refunds'
      }]
    });

    apimap.push({
      name: 'stripe_invoices',
      isVirtual: true,
      isReadOnly: true,
      fields: [
        { field: 'id', type: 'String', isSearchable: false },
        { field: 'amount_due', type: 'Number', isSearchable: false },
        { field: 'attempt_count', type: 'Number', isSearchable: false },
        { field: 'attempted', type: 'Boolean', isSearchable: false },
        { field: 'closed', type: 'Boolean', isSearchable: false },
        { field: 'currency', type: 'String', isSearchable: false },
        { field: 'date', type: 'Date', isSearchable: false },
        { field: 'forgiven', type: 'Boolean', isSearchable: false },
        { field: 'period_start', type: 'Date', isSearchable: false },
        { field: 'period_end', type: 'Date', isSearchable: false },
        { field: 'subtotal', type: 'Number', isSearchable: false },
        { field: 'total', type: 'Number', isSearchable: false },
        { field: 'application_fee', type: 'Number', isSearchable: false },
        { field: 'tax', type: 'Number', isSearchable: false },
        { field: 'tax_percent', type: 'Number', isSearchable: false },
        {
          field: 'customer',
          type: 'String',
          reference: referenceName,
          isSearchable: false
        }
      ]
    });

    apimap.push({
      name: 'stripe_cards',
      isVirtual: true,
      isReadOnly: true,
      onlyForRelationships: true,
      fields: [
        { field: 'id', type: 'String', isSearchable: false },
        { field: 'last4', type: 'String', isSearchable: false },
        { field: 'brand', type: 'String', isSearchable: false },
        { field: 'funding', type: 'String', isSearchable: false },
        { field: 'exp_month', type: 'Number', isSearchable: false },
        { field: 'exp_year', type: 'Number', isSearchable: false },
        { field: 'country', type: 'String', isSearchable: false },
        { field: 'name', type: 'String', isSearchable: false },
        { field: 'address_line1', type: 'String', isSearchable: false },
        { field: 'address_line2', type: 'String', isSearchable: false },
        { field: 'address_city', type: 'String', isSearchable: false },
        { field: 'address_state', type: 'String', isSearchable: false },
        { field: 'address_zip', type: 'String', isSearchable: false },
        { field: 'address_country', type: 'String', isSearchable: false },
        { field: 'cvc_check', type: 'String', isSearchable: false },
        {
          field: 'customer',
          type: 'String',
          reference: referenceName,
          isSearchable: false
        }
      ]
    });
  }

  function hasIntercomIntegration() {
    return opts.integrations && opts.integrations.intercom &&
      opts.integrations.intercom.apiKey && opts.integrations.intercom.appId;
  }

  function setupIntercomIntegration(apimap) {
    // jshint camelcase: false
    apimap.push({
      name: 'intercom_conversations',
      onlyForRelationships: true,
      isVirtual: true,
      fields: [
        { field: 'subject', type: 'String' },
        { field: 'body', type: ['String'], widget: 'link' },
        { field: 'open', type: 'Boolean'},
        { field: 'read', type: 'Boolean'},
        { field: 'assignee', type: 'String' }
      ]
    });

    apimap.push({
      name: 'intercom_attributes',
      onlyForRelationships: true,
      isVirtual: true,
      fields: [
        { field: 'created_at', type: 'Date', isSearchable: false },
        { field: 'updated_at', type: 'Date', isSearchable: false  },
        { field: 'session_count', type: 'Number', isSearchable: false  },
        { field: 'last_seen_ip', type: 'String', isSearchable: false  },
        { field: 'signed_up_at', type: 'Date', isSearchable: false  },
        { field: 'country', type: 'String', isSearchable: false  },
        { field: 'city', type: 'String', isSearchable: false  },
        { field: 'browser', type: 'String', isSearchable: false  },
        { field: 'platform', type: 'String', isSearchable: false  },
        { field: 'companies', type: 'String', isSearchable: false  },
        { field: 'segments', type: 'String', isSearchable: false  },
        { field: 'tags', type: 'String', isSearchable: false  },
        {
          field: 'geoloc',
          type: 'String',
          widget: 'google map',
          isSearchable: false
        }
      ]
    });
  }

  var app = express();

  // CORS
  app.use(cors({
    allowedOrigins: ['http://localhost:4200', 'https://www.forestadmin.com',
      'http://www.forestadmin.com'],
      headers: ['Authorization', 'X-Requested-With', 'Content-Type',
        'Stripe-Reference']
  }));

  // Mime type
  app.use(bodyParser.json({type: 'application/vnd.api+json'}));

  // Authentication
  app.use(jwt({
    secret: opts.jwtSigningKey,
    credentialsRequired: false
  }));

  // Init
  var absModelDirs = path.resolve('.', opts.modelsDir);
  requireAllModels(absModelDirs, opts)
    .then(function (models) {
      return Schemas.perform(models, opts)
        .then(function () {
          return requireAllModels(absModelDirs + '/forest', opts)
            .catch(function () {
              // The forest/ directory does not exist. It's not a problem.
            });
        })
        .thenReturn(models);
    })
    .each(function (model) {
      new StripeRoutes(app, model, opts).perform();
      new IntercomRoutes(app, model, opts).perform();
      new ResourcesRoutes(app, model, opts).perform();
      new AssociationsRoutes(app, model, opts).perform();
      new StatRoutes(app, model, opts).perform();
    })
    .then(function () {
      if (opts.jwtSigningKey) {
        var collections = _.values(Schemas.schemas);

        if (hasStripeIntegration()) {
          setupStripeIntegration(collections);
        }

        if (hasIntercomIntegration()) {
          setupIntercomIntegration(collections);
        }

        var json = new JSONAPISerializer('collections', collections, {
          id: 'name',
          attributes: ['name', 'fields', 'actions', 'onlyForRelationships',
            'isVirtual', 'isReadOnly'],
          fields: {
            attributes: ['field', 'type', 'collection_name', 'reference',
              'column', 'isSearchable', 'widget']
          },
          actions: {
            ref: 'name',
            attributes: ['name', 'endpoint', 'httpMethod']
          },
          meta: {
            'liana': 'forest-express-mongoose',
            'liana_version': require('./package.json').version
          }
        });

        var forestUrl = process.env.FOREST_URL ||
          'https://forestadmin-server.herokuapp.com';

        request
          .post(forestUrl + '/forest/apimaps')
            .send(json)
            .set('forest-secret-key', opts.jwtSigningKey)
            .end(function(err, res) {
              if (res.status !== 204) {
                logger.debug('Forest cannot find your project secret key. ' +
                  'Please, ensure you have installed the Forest Liana ' +
                  'correctly.');
              }
            });
      }
    });

  return app;
};

exports.collection = function (name, opts) {
  var collection = _.findWhere(Schemas.schemas, { name: name });

  if (!collection) {
    opts.name = name;
    Schemas.schemas[name] = opts;
  } else {
    Schemas.schemas[name].actions = opts.actions;
  }
};

exports.ensureAuthenticated = require('./services/auth').ensureAuthenticated;
exports.StatSerializer = require('./serializers/stat') ;
exports.ResourceSerializer = require('./serializers/resource') ;
