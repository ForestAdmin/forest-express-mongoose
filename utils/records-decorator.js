'use strict';

function decorateForSearch(records, fieldsSearched, searchValue) {
  var matchFields = {};
  records.forEach(function (record, index) {
    Object.keys(record).forEach(function (attributeName) {
      var value = record[attributeName];
      if (value) {
        value = value.toString();
        var match = fieldsSearched.includes(attributeName) && value.match(new RegExp(searchValue, 'i'));
        if (match) {
          if (!matchFields[index]) {
            matchFields[index] = {
              id: record.id,
              search: [],
            };
          }
          matchFields[index]['search'].push(attributeName);
        }
      }
    });
  });

  return matchFields;
}

exports.decorateForSearch = decorateForSearch;
