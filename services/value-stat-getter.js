'use strict';
var _ = require('lodash');
var P = require('bluebird');
var FilterParser = require('./filter-parser');

function ValueStatGetter(model, params, opts) {

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model.aggregate();

      if (params.filterType && params.filters) {
        var operator = '$' + params.filterType;
        var queryFilters = {};
        queryFilters[operator] = [];

        _.each(params.filters, function (filter) {
          var conditions = new FilterParser(model, opts, params.timezone)
            .perform(filter.field, filter.value);
          _.each(conditions, function (condition) {
            queryFilters[operator].push(condition);
          });
        });

        query.match(queryFilters);
      }

      var sum = 1;
      // jshint sub: true
      if (params['aggregate_field']) {
        sum = '$' + params['aggregate_field'];
      }

      query
        .group({
          _id: null,
          total: { $sum: sum }
        })
        .exec(function (err, records) {
          if (err) { return reject(err); }
          if (!records || !records.length) { return resolve({ value: 0 }); }

          resolve({ value: records[0].total });
        });
    });
  };
}

module.exports = ValueStatGetter;
