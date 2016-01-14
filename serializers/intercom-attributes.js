'use strict';
var JSONAPISerializer = require('jsonapi-serializer');
var Inflector = require('inflected');

function IntercomAttributesSerializer(attributes, customerCollectionName, meta) {
  return new JSONAPISerializer('intercom-attributes', attributes, {
    attributes: ['session_count', 'last_seen_ip', 'created_at', 'updated_at',
      'signed_up_at', 'last_request_at', 'country', 'city', 'user_agent',
      'companies', 'segments', 'tags', 'browser', 'platform', 'geoloc'],
    keyForAttribute: function (key) {
      return Inflector.underscore(key);
    },
    meta: meta
  });
}

module.exports = IntercomAttributesSerializer;
