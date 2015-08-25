'use strict';
var P = require('bluebird');
var _ = require('lodash');
var MongooseUtils = require('../services/mongoose-utils');
var HasManyFinder = require('./has-many-finder');

function ResourcesFinder(model, opts, params) {

  function getHasManyParam() {
    return _.findKey(params, function (value, key) {
      return /.*Id/.test(key);
    });
  }

  function count () {
    return new P(function (resolve, reject) {
      model.count(function (err, count) {
        if (err) { return reject(err); }
        resolve(count);
      });
    });
  }

  function getRecords() {
    return new P(function (resolve, reject) {
      var query = model.find();

      query
        .limit(getLimit())
        .skip(getSkip());

      _.each(model.schema.paths, function (value, key) {
        if (MongooseUtils.getReference(value)) {
          query = query.populate(key);
        }
      });


      if (params.sort) {
        if (params.sort.split('.').length > 1) {
          query.sort(params.sort.split('.')[0]);
        } else {
          query.sort(params.sort);
        }
      }

      query.lean().exec(function (err, records) {
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
    var hasManyParam = getHasManyParam();
    if (hasManyParam) {
      return new HasManyFinder(model, hasManyParam, opts, params).perform();
    } else {
      return new P.all([count(), getRecords()]);
    }
  };
}

module.exports = ResourcesFinder;
