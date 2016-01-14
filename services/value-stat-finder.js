'use strict';
var _ = require('lodash');
var P = require('bluebird');
var FilterParser = require('./filter-parser');

function ValueStatFinder(model, params, opts) {

  function getAggregateField() {
    // jshint sub: true
    return params['aggregate_field'] || '_id';
  }

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model.find();

      if (params.filters) {
        _.each(params.filters, function (filter) {
          query = new FilterParser(model, opts).perform(query, filter.field,
            filter.value);
        });
      }

      query = query.distinct(getAggregateField());

      query
        .lean()
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve({ value: records.length });
        });
    });
  };
}

module.exports = ValueStatFinder;
