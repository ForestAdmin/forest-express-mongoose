'use strict';
var P = require('bluebird');
var mongoose = require('mongoose');
var createError = require('http-errors');

function EmbeddedResourceUpdater(model, params, record) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var recordId = params.recordId;
      var recordIndex = parseInt(params.recordIndex, 10);

      delete record._id;

      var id = mongoose.Types.ObjectId(recordId);
      var subDocumentName = Object.keys(record)[0];

      if (!subDocumentName || !subDocumentName.length) {
        return reject(createError(400, 'Invalid data'));
      }

      var data = record[subDocumentName];

      var update = Object.keys(data).reduce(function (acc, value) {
        acc.$set[subDocumentName + '.' + recordIndex + '.' + value] = data[value];
        return acc;
      }, { $set: {} });

      model.update({ _id: id }, update, function (err) {
        if (err) { return reject(err); }
        console.log('ok');
        resolve();
      });
    });
  };
}

module.exports = EmbeddedResourceUpdater;
