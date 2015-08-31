'use strict';
var P = require('bluebird');
var _ = require('lodash');
var HasManyFinder = require('./has-many-finder');

function ResourcesFinder(model, opts, params) {

  function getHasManyParam() {
    return _.findKey(params, function (value, key) {
      return /.*Id/.test(key);
    });
  }

  function count (query) {
    return new P(function (resolve, reject) {
      query.count(function (err, count) {
        if (err) { return reject(err); }
        resolve(count);
      });
    });
  }

  function handleSearchParam(query) {
    if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
      query.where({ _id: params.search });
    } else {
      var orQuery = { $or: [] };

      _.each(model.schema.paths, function (value, key) {
        if (value.instance === 'String') {
          var q = {};
          q[key] = new RegExp('.*' + params.search + '.*', 'i');

          orQuery.$or.push(q);
        }
      });

      query.where(orQuery);
    }
  }

  function handleFilterParams(query) {
    _.each(params.filter, function (value, key) {
      var q = {};

      if (value[0] === '!') {
        q[key] = { $ne: value.substring(1) };
      } else if (value[0] === '*' && value[value.length - 1] === '*') {
        q[key] = new RegExp('.*' + value.substring(1, value.length - 1) +
          '.*');
      } else if (value[0] === '*') {
        q[key] = new RegExp('.*' + value.substring(1) + '$');
      } else if (value[value.length - 1]) {
        q[key] = new RegExp('^' + value.substring(0, value.length - 1) +
          '.*');
      } else {
        q[key] = value;
      }

      query.where(q);
    });
  }

  function handleSortParam(query) {
    if (params.sort.split('.').length > 1) {
      query.sort(params.sort.split('.')[0]);
    } else {
      query.sort(params.sort);
    }
  }

  function getRecords() {
    var query = model.find();

    if (params.search) {
      handleSearchParam(query);
    }

    if (params.filter) {
      handleFilterParams(query);
    }

    return query;
  }

  function exec(query) {
    return new P(function (resolve, reject) {
      if (params.sort) {
        handleSortParam(query);
      }

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
    return 10;
    //if (hasPagination()) {
      //return params.page.size || 10;
    //} else {
      //return 10;
    //}
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
      var query = getRecords();
      return new P.all([count(query), exec(getRecords())]);
    }
  };
}

module.exports = ResourcesFinder;
