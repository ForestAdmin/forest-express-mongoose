const _ = require('lodash');
const Interface = require('forest-express');
const SearchBuilder = require('./search-builder');
const utils = require('../utils/schema');
const FiltersParser = require('./filters-parser');

function HasManyGetter(model, association, opts, params) {
  const OBJECTID_REGEXP = /^[0-9a-fA-F]{24}$/;
  const schema = Interface.Schemas.schemas[utils.getModelName(association)];
  const searchBuilder = new SearchBuilder(association, opts, params);
  const filtersParser = new FiltersParser(association, params.timezone, opts);

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

  async function buildConditions(recordIds) {
    const conditions = {
      $and: [{ _id: { $in: recordIds } }],
    };

    if (params.search) {
      const conditionsSearch = await searchBuilder.getConditions();
      conditions.$and.push(conditionsSearch);
    }

    if (params.filters) {
      const newFilters = await filtersParser.replaceAllReferences(params.filters);
      const newFiltersString = JSON.stringify(newFilters);
      conditions.$and.push(await filtersParser.perform(newFiltersString));
    }

    return conditions;
  }

  async function getRecordsAndRecordIds() {
    let id = params.recordId;
    if (OBJECTID_REGEXP.test(params.recordId)) {
      id = opts.Mongoose.Types.ObjectId(id);
    }

    const records1 = await model
      .aggregate()
      .match({ _id: id })
      .unwind(params.associationName)
      .project(getProjection())
      .exec();

    const recordIds = _.map(records1, (record) => record[params.associationName]);
    const conditions = await buildConditions(recordIds);
    const query = association.find(conditions);
    handlePopulate(query);

    const records2 = await query;
    return [records2, recordIds];
  }

  this.perform = async () => {
    const recordsAndRecordIds = await getRecordsAndRecordIds();
    const records1 = recordsAndRecordIds[0];
    let fieldSort = params.sort;
    let descending = false;

    if (params.sort && (params.sort[0] === '-')) {
      fieldSort = params.sort.substring(1);
      descending = true;
    }

    let recordsSorted;
    if (fieldSort) {
      recordsSorted = _.sortBy(records1, (record) => record[fieldSort]);
    } else {
      const recordIds = recordsAndRecordIds[1];
      // NOTICE: Convert values to strings, so ObjectIds could be easily searched and compared.
      const recordIdStrings = recordIds.map((recordId) => String(recordId));
      // NOTICE: indexOf could be improved by making a Map from record-ids to their index.
          recordsSorted = _.sortBy(records1, record => recordIdStrings.indexOf(String(record._id))); // eslint-disable-line
    }

    let records2 = descending ? recordsSorted.reverse() : recordsSorted;
    let fieldsSearched = null;

    if (params.search) {
      fieldsSearched = searchBuilder.getFieldsSearched();
    }

    records2 = _.slice(records2, getSkip(), getSkip() + getLimit());

    return [records2, fieldsSearched];
  };

  this.count = async () => {
    const recordsAndRecordIds = await getRecordsAndRecordIds();
    return recordsAndRecordIds[0].length;
  };
}

module.exports = HasManyGetter;
