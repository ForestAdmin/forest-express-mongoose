'use strict';
var P = require('bluebird');

function BelongsToUpdater(model, association, opts, params, data) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var updateParams = {};
      updateParams[params.associationName] = data.data ? data.data.id : null;

      model
        .findByIdAndUpdate(params.recordId, {
          $set: updateParams
        }, {
          new: true
        })
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  };
}

module.exports = BelongsToUpdater;
