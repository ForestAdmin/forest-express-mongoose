const _ = require('lodash');

function decorateForSearch(records, fields, searchValue) {
  const matchFields = {};
  records.forEach((record, index) => {
    fields.forEach((fieldName) => {
      const value = record[fieldName];
      if (value) {
        const searchEscaped = searchValue.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&');
        const searchHighlight = new RegExp(searchEscaped, 'i');
        const match = value.toString().match(searchHighlight);
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

  return _.isEmpty(matchFields) ? null : matchFields;
}

exports.decorateForSearch = decorateForSearch;
