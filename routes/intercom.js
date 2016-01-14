'use strict';
var _ = require('lodash');
var Inflector = require('inflected');
var IntercomAttributesFinder = require('../services/intercom-attributes-finder');
var IntercomAttributesSerializer = require('../serializers/intercom-attributes');
var IntercomConversationsFinder = require('../services/intercom-conversations-finder');
var IntercomConversationsSerializer = require('../serializers/intercom-conversations');
var auth = require('../services/auth');

module.exports = function (app, model, opts) {
  var modelName = Inflector.pluralize(model.modelName).toLowerCase();

  this.intercomAttributes = function (req, res, next) {
    new IntercomAttributesFinder(_.extend(req.query, req.params), opts)
      .perform()
      .then(function (attributes) {
        return new IntercomAttributesSerializer(attributes, modelName);
      })
      .then(function (attributes) {
        res.send(attributes);
      })
      .catch(next);
  };

  this.intercomConversations = function (req, res, next) {
    new IntercomConversationsFinder(_.extend(req.query, req.params), opts)
      .perform()
      .spread(function (count, conversations) {
        return new IntercomConversationsSerializer(conversations, modelName,
          { count: count });
      })
      .then(function (conversations) {
        res.send(conversations);
      })
      .catch(next);
  };

  this.perform = function () {
    app.get('/forest/' + modelName + '/:recordId/intercom_attributes',
      auth.ensureAuthenticated, this.intercomAttributes);

    app.get('/forest/' + modelName + '/:recordId/intercom_conversations',
      auth.ensureAuthenticated, this.intercomConversations);
  };
};
