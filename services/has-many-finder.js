'use strict';
var P = require('bluebird');

function HasManyFinder(model, hasManyParam, opts, params) {

  function capitalize(s) {
    return s[0].toUpperCase() + s.substr(1);
  }

  function count() {
    return new P(function (resolve, reject) {
      var models = opts.mongoose.models;

      var parentModelName = capitalize(
        hasManyParam.substring(0, hasManyParam.length - 2));
      var parentModel = models[parentModelName];

      var query = parentModel.findById(params[hasManyParam]);
      query
        .exec(function (err, record) {
          if (err) { return reject(err); }
          return resolve(record[model.collection.name].length);
        });
    });
  }

  function getRecords() {
    return new P(function (resolve, reject) {
      var models = opts.mongoose.models;

      var parentModelName = capitalize(
        hasManyParam.substring(0, hasManyParam.length - 2));
        var parentModel = models[parentModelName];

        var query = parentModel.findById(params[hasManyParam]);
        var populateOpts = {
          limit: getLimit(),
          skip: getSkip()
        };

        if (params.sort) {
          populateOpts.sort = params.sort;
        }

        query
        .populate({
          path: model.collection.name,
          options: populateOpts
        })
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          return resolve(record[model.collection.name]);
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
    return P.all([count(), getRecords()]);
  };
}

module.exports = HasManyFinder;
