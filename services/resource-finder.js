'use strict';
var P = require('bluebird');
var JSONAPISerializer = require('jsonapi-serializer');

function ResourceFinder(model, opts) {
  function find() {
    return new P(function (resolve, reject) {
      model
        .find()
        .limit(15)
        .lean()
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve(records);
        });
    });
  }

  this.perform = function () {
    return find()
      .then(function (records) {
        return new JSONAPISerializer(model.collection.name, records, {
          apiEndpoint: opts.apiEndpoint,
          id: '_id',
          attributes: Object.keys(model.schema.paths)
        });
      });
  };
}

module.exports = ResourceFinder;
