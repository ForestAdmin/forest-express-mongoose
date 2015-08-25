'use strict';
var P = require('bluebird');
var _ = require('lodash');
var MongooseUtils = require('../services/mongoose-utils');

function ResourcesFinder(model, params) {

  function count () {
    return new P(function (resolve, reject) {
      model.count(function (err, count) {
        if (err) { return reject(err); }
        resolve(count);
      });
    });
  }

  function getRecords(query) {
    return new P(function (resolve, reject) {
      query
        .limit(getLimit())
        .skip(getSkip())
        .lean()
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve(records);
        });
    });
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
    } else {
      return 10;
    }
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  this.perform = function () {
    var query = model.find();

    _.each(model.schema.paths, function (value, key) {
      if (MongooseUtils.getReference(value)) {
        query = query.populate(key);
      }
    });

    return new P.all([count(), getRecords(query)]);
  };
}

module.exports = ResourcesFinder;
