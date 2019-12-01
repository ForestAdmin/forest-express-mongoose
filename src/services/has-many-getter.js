const _ = require('lodash');
const P = require('bluebird');
const Interface = require('forest-express');
const SearchBuilder = require('./search-builder');
const utils = require('../utils/schema');

function HasManyGetter(model, association, opts, params) {
  const OBJECTID_REGEXP = /^[0-9a-fA-F]{24}$/;
  const schema = Interface.Schemas.schemas[utils.getModelName(association)];
  const searchBuilder = new SearchBuilder(association, opts, params);

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return parseInt(params.page.number, 10) * params.page.size;
    }
    return 5;
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number, 10) - 1) * params.page.size;
    }
    return 0;
  }

  function getProjection() {
    const projection = {};
    projection[params.associationName] = 1;
    projection._id = 0; // eslint-disable-line

    return projection;
  }

  function handlePopulate(query) {
    _.each(schema.fields, (field) => {
      if (field.reference) {
        query.populate({
          path: field.field,
        });
      }
    });
  }

  function getRecordsAndRecordIds() {
    return new P((resolve, reject) => {
      let id = params.recordId;
      if (OBJECTID_REGEXP.test(params.recordId)) {
        id = opts.mongoose.Types.ObjectId(id);
      }

      return model
        .aggregate()
        .match({ _id: id })
        .unwind(params.associationName)
        .project(getProjection())
        .exec((error, records) => {
          if (error) { return reject(error); }
          return resolve(_.map(records, (record) => record[params.associationName]));
        });
    })
      .then(async (recordIds) => {
        const conditions = {
          $and: [{ _id: { $in: recordIds } }],
        };

        if (params.search) {
          const conditionsSearch = await searchBuilder.getConditions();
          conditions.$and.push(conditionsSearch);
        }

        const query = association.find(conditions);
        handlePopulate(query);

        return query.then((records) => [records, recordIds]);
      });
  }

  this.perform = () =>
    getRecordsAndRecordIds()
      .then((recordsAndRecordIds) => {
        const records = recordsAndRecordIds[0];
        let fieldSort = params.sort;
        let descending = false;

        if (params.sort && (params.sort[0] === '-')) {
          fieldSort = params.sort.substring(1);
          descending = true;
        }

        let recordsSorted;
        if (fieldSort) {
          recordsSorted = _.sortBy(records, (record) => record[fieldSort]);
        } else {
          const recordIds = recordsAndRecordIds[1];
          // NOTICE: Convert values to strings, so ObjectIds could be easily searched and compared.
          const recordIdStrings = recordIds.map((recordId) => String(recordId));
          // NOTICE: indexOf could be improved by making a Map from record-ids to their index.
          recordsSorted = _.sortBy(records, record => recordIdStrings.indexOf(String(record._id))); // eslint-disable-line
        }
        return descending ? recordsSorted.reverse() : recordsSorted;
      })
      .then((records) => {
        let fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
        }

        records = _.slice(records, getSkip(), getSkip() + getLimit());

        return [records, fieldsSearched];
      });

  this.count = () =>
    getRecordsAndRecordIds()
      .then((recordsAndRecordIds) => recordsAndRecordIds[0].length);
}

module.exports = HasManyGetter;
