'use strict';

var _ = require('lodash');

function decorateForSearch(records, fields, searchValue) {
  var matchFields = {};
  records.forEach(function (record, index) {
    record = record.toObject();
    fields.forEach(function (fieldName) {
      var value = record[fieldName];
      if (value) {
        var match = value.toString().match(new RegExp(searchValue, 'i'));
        if (match) {
          if (!matchFields[index]) {
            matchFields[index] = {
              id: record._id,
              search: [],
            };
          }
          matchFields[index].search.push(fieldName);
        }
      }
    });
  });

  if (_.isEmpty(matchFields)) {
    matchFields = null;
  }

  return matchFields;
}

exports.decorateForSearch = decorateForSearch;
