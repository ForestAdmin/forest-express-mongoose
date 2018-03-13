'use strict';

function EmbeddedDocumentUpdater(model, params, association, record) {
  this.perform = function () {
    var recordId = params.recordId;
    var recordIndex = parseInt(params.recordIndex, 10);

    delete record._id;

    var update = Object.keys(record).reduce(function (acc, value) {
      acc.$set[association + '.' + recordIndex + '.' + value] = record[value];
      return acc;
    }, { $set: {} });

    return model.findByIdAndUpdate(recordId, update);
  };
}

module.exports = EmbeddedDocumentUpdater;
