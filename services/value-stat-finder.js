'use strict';
var P = require('bluebird');
var OperatorValueParser = require('./operator-value-parser');

function ValueStatFinder(model, params, opts) {

  function getFilters() {
    var filters = {};

    if (params.filters) {
      params.filters.forEach(function (filter) {
        filters[filter.field] = new OperatorValueParser(opts).perform(model,
          filter.field, filter.value);
      });
    }

    return filters;
  }

  function getAggregateField() {
    // jshint sub: true
    return params['aggregate_field'] || '_id';
  }

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model.find(getFilters()).distinct(getAggregateField());

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
