'use strict';
var ResourcesGetter = require('./resources-getter');

var BATCH_INITIAL_PAGE = 1;
var BATCH_SIZE = 1000;

function RecordsExporter(model, options, params) {
  params.sort = '_id';
  params.page = { size: BATCH_SIZE };

  function retrieveBatch(dataSender, pageNumber) {
    params.page.number = pageNumber;
    return new ResourcesGetter(model, options, params)
      .perform()
      .then(function (results) {
        var records = results[1];

        return dataSender(records)
          .then(function () {
            if (records.length === BATCH_SIZE) {
              return retrieveBatch(dataSender, pageNumber + 1);
            } else {
              return;
            }
          });
      });
  }

  this.perform = function (dataSender) {
    return retrieveBatch(dataSender, BATCH_INITIAL_PAGE);
  };
}

module.exports = RecordsExporter;
