const _ = require('lodash');
const Interface = require('forest-express');
const SearchBuilder = require('./search-builder');
const utils = require('../utils/schema');
const FiltersParser = require('./filters-parser');

function HasManyGetter(parentModel, childModel, opts, params) {
  const OBJECTID_REGEXP = /^[0-9a-fA-F]{24}$/;
  const schema = Interface.Schemas.schemas[utils.getModelName(childModel)];
  const searchBuilder = new SearchBuilder(childModel, opts, params);
  const filtersParser = new FiltersParser(childModel, params.timezone, opts);

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

    const parentRecords = await parentModel
      .aggregate()
      .match({ _id: id })
      .unwind(params.associationName)
      .project(getProjection())
      .exec();

    const childRecordIds = _.map(parentRecords, (record) => record[params.associationName]);
    const conditions = await buildConditions(childRecordIds);
    const query = childModel.find(conditions);
    handlePopulate(query);

    const childRecords = await query;
    return [childRecords, childRecordIds];
  }

  this.perform = async () => {
    const [childRecords, childRecordIds] = await getRecordsAndRecordIds();

    let fieldSort = params.sort;
    let descending = false;

    if (params.sort && (params.sort[0] === '-')) {
      fieldSort = params.sort.substring(1);
      descending = true;
    }

    let recordsSorted;
    if (fieldSort) {
      recordsSorted = _.sortBy(childRecords, (record) => record[fieldSort]);
    } else {
      // NOTICE: Convert values to strings, so ObjectIds could be easily searched and compared.
      const recordIdStrings = childRecordIds.map((recordId) => String(recordId));
      // NOTICE: indexOf could be improved by making a Map from record-ids to their index.
          recordsSorted = _.sortBy(childRecords, record => recordIdStrings.indexOf(String(record._id))); // eslint-disable-line
    }

    let sortedChildRecords = descending ? recordsSorted.reverse() : recordsSorted;
    let fieldsSearched = null;

    if (params.search) {
      fieldsSearched = searchBuilder.getFieldsSearched();
    }

    sortedChildRecords = _.slice(sortedChildRecords, getSkip(), getSkip() + getLimit());

    return [sortedChildRecords, fieldsSearched];
  };

  this.count = async () => {
    const recordsAndRecordIds = await getRecordsAndRecordIds();
    return recordsAndRecordIds[0].length;
  };
}

module.exports = HasManyGetter;
