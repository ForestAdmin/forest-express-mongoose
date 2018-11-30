'use strict';
var P = require('bluebird');

function HasManyAssociator(model, association, opts, params, data) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var updateParams = {};
      updateParams[params.associationName] = {
        $each: data.data.map(function (document) { return document.id; }),
      };

      model
        .findByIdAndUpdate(params.recordId, {
          $push: updateParams,
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

module.exports = HasManyAssociator;
