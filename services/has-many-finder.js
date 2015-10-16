'use strict';
var P = require('bluebird');

function HasManyFinder(model, opts, params) {

  function count() {
    return new P(function (resolve, reject) {
      model.findById(params.recordId)
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record[params.associationName].length);
        });
    });
  }

  function getRecords() {
    return new P(function (resolve, reject) {
      var query = model.findById(params.recordId)
        .populate({
          path: params.associationName,
          options: { limit: getLimit(), skip: getSkip() }
        });

      query.exec(function (err, record) {
        if (err) { return reject(err); }
        resolve(record[params.associationName]);
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
