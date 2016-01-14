'use strict';
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');

function IntercomConversationsSerializer(conversations, customerCollectionName, meta) {
  conversations = conversations.map(function (conversation) {
    // jshint camelcase: false
    conversation.subject =  conversation.conversation_message.subject;
    conversation.body = [conversation.conversation_message.body,
      conversation.link];

    if (conversation.assignee) {
      conversation.assignee =  conversation.assignee.email;
    }

    return conversation;
  });

  return new JSONAPISerializer('intercom-conversations', conversations, {
    attributes: ['created_at', 'updated_at', 'open', 'read', 'subject',
      'body', 'assignee'],
    keyForAttribute: function (key) {
      return Inflector.underscore(key);
    },
    meta: meta
  });
}

module.exports = IntercomConversationsSerializer;
