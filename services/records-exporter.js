'use strict';
var ResourcesGetter = require('./resources-getter');
var HasManyGetter = require('./has-many-getter');

var BATCH_INITIAL_PAGE = 1;
var BATCH_SIZE = 1000;

function RecordsExporter(model, options, params, association) {
  params.sort = '_id';
  params.page = { size: BATCH_SIZE };

  function getter() {
    if (association) {
      return new HasManyGetter(model, association, options, params);
    } else {
      return new ResourcesGetter(model, options, params);
    }
  }

  function retrieveBatch(dataSender, pageNumber) {
    params.page.number = pageNumber;
    return getter()
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
