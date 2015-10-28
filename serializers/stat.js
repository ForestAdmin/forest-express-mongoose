'use strict';
var JSONAPISerializer = require('jsonapi-serializer');
var uuid = require('node-uuid');

function StatSerializer(stat) {
  stat.id = uuid.v1();

  this.perform = function () {
    return new JSONAPISerializer('stats', stat, {
      attributes: ['value']
    });
  };
}

module.exports = StatSerializer;
