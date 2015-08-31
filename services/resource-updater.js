'use strict';
var P = require('bluebird');
var _ = require('lodash');
var MongooseUtils = require('../services/mongoose-utils');

function ResourceUpdater(model, params) {

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model
        .findByIdAndUpdate(params.id, {
          $set: params
        }, {
          new: true
        });

      _.each(model.schema.paths, function (value, key) {
        if (MongooseUtils.getReference(value)) {
          query = query.populate(key);
        }
      });

      query
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  };
}

module.exports = ResourceUpdater;
