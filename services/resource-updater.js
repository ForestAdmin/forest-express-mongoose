'use strict';
var P = require('bluebird');
var _ = require('lodash');
var JSONAPISerializer = require('jsonapi-serializer');
var changeCase = require('change-case');

function ResourceUpdater(model, body) {
  function attributes() {
    return _.mapKeys(body.data.attributes, function (value, key) {
      return changeCase.camel(key);
    });
  }

  function update() {
    return new P(function (resolve, reject) {
      model
        .findByIdAndUpdate(body.data.id, { $set: attributes() }, { new: true })
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  }

  this.perform = function () {
    return update()
      .then(function (record) {
        return new JSONAPISerializer(model.collection.name, record, {
          id: '_id',
          attributes: Object.keys(model.schema.paths)
        });
      });
  };
}

module.exports = ResourceUpdater;
