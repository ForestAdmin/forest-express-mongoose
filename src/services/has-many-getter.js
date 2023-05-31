import Interface from 'forest-express';
import _ from 'lodash';
import utils from '../utils/schema';
import getScopedParams from '../utils/scopes';
import FiltersParser from './filters-parser';
import SearchBuilder from './search-builder';
import Flattener from './flattener';

const OBJECTID_REGEXP = /^[0-9a-fA-F]{24}$/;

class HasManyGetter {
  constructor(parentModel, model, opts, params, user) {
    this._parentModel = parentModel;
    this._model = model;
    this._params = params;
    this._opts = { Mongoose: model.base, connections: model.base.connections };
    this._user = user;
    this._searchBuilder = new SearchBuilder(model, this._opts, params);
  }

  _hasPagination() {
    return this._params.page && this._params.page.number;
  }

  _getLimit() {
    if (this._hasPagination()) {
      return parseInt(this._params.page.number, 10) * this._params.page.size;
    }
    return 5;
  }

  _getSkip() {
    if (this._hasPagination()) {
      return (parseInt(this._params.page.number, 10) - 1) * this._params.page.size;
    }
    return 0;
  }

  _getProjection() {
    const projection = {};
    projection[Flattener.unflattenFieldName(this._params.associationName)] = 1;
    projection._id = 0; // eslint-disable-line

    return projection;
  }

  _handlePopulate(query) {
    const schema = Interface.Schemas.schemas[utils.getModelName(this._model)];

    _.each(schema.fields, (field) => {
      if (field.reference) {
        query.populate({
          path: field.field,
        });
      }
    });
  }

  async _buildConditions(recordIds) {
    const conditions = { $and: [{ _id: { $in: recordIds } }] };

    const params = await getScopedParams(this._params, this._model, this._user);
    if (params.search) {
      const conditionsSearch = await this._searchBuilder.getConditions();
      conditions.$and.push(conditionsSearch);
    }

    if (params.filters) {
      const filtersParser = new FiltersParser(this._model, params.timezone, this._opts);
      const newFilters = await filtersParser.replaceAllReferences(params.filters);
      const newFiltersString = JSON.stringify(newFilters);
      conditions.$and.push(await filtersParser.perform(newFiltersString));
    }

    return conditions;
  }

  async _getRecordsAndRecordIds() {
    let id = this._params.recordId;
    if (OBJECTID_REGEXP.test(this._params.recordId)) {
      id = new this._opts.Mongoose.Types.ObjectId(id);
    }

    const parentRecords = await this._parentModel
      .aggregate()
      .match({ _id: id })
      .unwind(`$${Flattener.unflattenFieldName(this._params.associationName)}`)
      .project(this._getProjection())
      .exec();


    const splitted = this._params.associationName.split('@@@');
    const childRecordIds = _.map(parentRecords, (record) =>
      splitted.reduce((a, prop) => (a ? a[prop] : null), record));
    const conditions = await this._buildConditions(childRecordIds);
    const query = this._model.find(conditions);
    this._handlePopulate(query);

    const childRecords = await query;
    return [childRecords, childRecordIds];
  }

  async perform() {
    const [childRecords, childRecordIds] = await this._getRecordsAndRecordIds();
    let fieldSort = this._params.sort;
    let descending = false;

    if (this._params.sort && (this._params.sort[0] === '-')) {
      fieldSort = this._params.sort.substring(1);
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

    if (this._params.search) {
      fieldsSearched = this._searchBuilder.getFieldsSearched();
    }

    sortedChildRecords = _.slice(
      sortedChildRecords, this._getSkip(), this._getSkip() + this._getLimit(),
    );

    return [sortedChildRecords, fieldsSearched];
  }

  async count() {
    const recordsAndRecordIds = await this._getRecordsAndRecordIds();
    return recordsAndRecordIds[0].length;
  }
}

module.exports = HasManyGetter;
