'use strict';
var P = require('bluebird');

function ResourceFinder(model, params) {

  this.perform = function () {
    return new P(function (resolve, reject) {
      var query = model.findById(params.recordId);

      query
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  };
}

module.exports = ResourceFinder;
