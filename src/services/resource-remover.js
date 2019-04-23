'use strict';
var P = require('bluebird');

function ResourceRemover(Model, params) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      Model.remove({ _id: params.recordId }, function (err) {
        if (err) { return reject(err); }
        resolve();
      });
    });
  };
}

module.exports = ResourceRemover;
