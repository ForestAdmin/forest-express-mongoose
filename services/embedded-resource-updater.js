'use strict';
var P = require('bluebird');
var mongoose = require('mongoose');

function EmbeddedResourceUpdater(model, params, record) {
  var recordId = params.recordId;
  var recordIndex = parseInt(params.recordIndex, 10);

  delete record._id;

  var id = mongoose.Types.ObjectId(recordId);
  var subDocumentName = Object.keys(record)[0];

  if (!subDocumentName || !subDocumentName.length) {
    // Handle error
  }

  var data = record[subDocumentName];

  var update = Object.keys(data).reduce(function (acc, value) {
    acc.$set[subDocumentName + '.' + recordIndex + '.' + value] = data[value];
    return acc;
  }, { $set: {} });

  this.perform = function () {
    return new P(function (resolve, reject) {
      model.update({ _id: id }, update, function (err) {
        if (err) { return reject(err); }
        console.log('ok');
        resolve();
      });
    });
  };
}

module.exports = EmbeddedResourceUpdater;
