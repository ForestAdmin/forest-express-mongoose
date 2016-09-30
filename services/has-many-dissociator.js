'use strict';
var P = require('bluebird');

function HasManyDissociator(model, association, opts, params, data) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var updateParams = {};
      updateParams[params.associationName] = {
        $in: data.data.map(function (d) { return d.id; })
      };

      model
        .findByIdAndUpdate(params.recordId, {
          $pull: updateParams
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

module.exports = HasManyDissociator;
