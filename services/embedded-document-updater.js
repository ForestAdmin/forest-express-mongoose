'use strict';
var P = require('bluebird');
var mongoose = require('mongoose');

function EmbeddedDocumentUpdater(model, params, association, record) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var recordId = params.recordId;
      var recordIndex = parseInt(params.recordIndex, 10);

      delete record._id;

      var id = mongoose.Types.ObjectId(recordId);
      var update = Object.keys(record).reduce(function (acc, value) {
        acc.$set[association + '.' + recordIndex + '.' + value] = record[value];
        return acc;
      }, { $set: {} });

      model.update({ _id: id }, update, function (err) {
        if (err) { return reject(err); }
        resolve();
      });
    });
  };
}

module.exports = EmbeddedDocumentUpdater;
