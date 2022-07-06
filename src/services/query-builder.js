import _ from 'lodash';
import Interface from 'forest-express';
import utils from '../utils/schema';
import Orm from '../utils/orm';
import SearchBuilder from './search-builder';
import FiltersParser from './filters-parser';
import ProjectionBuilder from './projection-builder';
import Flattener from './flattener';

class QueryBuilder {
  constructor(model, params, opts) {
    this._model = model;
    this._params = params;
    this._opts = opts;

    this._schema = Interface.Schemas.schemas[utils.getModelName(this._model)];
    this._searchBuilder = new SearchBuilder(
      this._model, this._opts, this._params, this._schema.searchFields,
    );
    this._filterParser = new FiltersParser(this._model, this._params.timezone, this._opts);
    this._projectionBuilder = new ProjectionBuilder(this._schema);
  }

  static _joinAlreadyExists(field, joinQuery) {
    return !!_.find(joinQuery, (join) => join && join.$lookup && join.$lookup.as === field.field);
  }

  async getFieldNamesRequested() {
    if (!this._params.fields || !this._params.fields[this._model.modelName]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    const associations = this._params.filters
      ? await this._filterParser.getAssociations(this._params.filters)
      : [];

    if (this._params.sort && this._params.sort.includes('.')) {
      let [associationFromSorting] = this._params.sort.split('.');
      if (associationFromSorting[0] === '-') {
        associationFromSorting = associationFromSorting.substring(1);
      }
      associations.push(associationFromSorting);
    }

    return _.union(
      this._params.fields[this._model.modelName].split(','),
      associations,
    );
  }

  async addProjection(jsonQuery) {
    const fieldNames = await this.getFieldNamesRequested();
    const projection = await this._projectionBuilder.getProjection(fieldNames);
    return projection && jsonQuery.push(projection);
  }

  addJoinToQuery(field, joinQuery) {
    if (field.reference && !field.isVirtual && !field.integration) {
      if (QueryBuilder._joinAlreadyExists(field, joinQuery)) return this;

      const referencedKey = utils.getReferenceField(field.reference);
      const subModel = utils.getReferenceModel(this._opts, field.reference);
      const unflattenedFieldName = Flattener.unflattenFieldName(field.field);

      joinQuery.push({
        $lookup: {
          from: subModel.collection.name,
          localField: unflattenedFieldName,
          foreignField: referencedKey,
          as: unflattenedFieldName,
        },
      });

      const fieldPath = unflattenedFieldName && this._model.schema.path(unflattenedFieldName);

      if (fieldPath && fieldPath.instance !== 'Array') {
        joinQuery.push({
          $unwind: {
            path: `$${unflattenedFieldName}`,
            preserveNullAndEmptyArrays: true,
          },
        });
      }
    }

    return this;
  }

  async joinAllReferences(jsonQuery, alreadyJoinedQuery) {
    let fieldNames = await this.getFieldNamesRequested();
    const flattenReferenceNames = Flattener
      .getFlattenedReferenceFieldsFromParams(this._model.modelName, this._params.fields);

    fieldNames = flattenReferenceNames.concat(fieldNames);

    this._schema.fields.forEach((field) => {
      if ((fieldNames && !fieldNames.includes(field.field))
          || QueryBuilder._joinAlreadyExists(field, alreadyJoinedQuery)) {
        return;
      }
      this.addJoinToQuery(field, jsonQuery);
    });
    return this;
  }

  async _addFiltersToQuery(jsonQuery) {
    const newFilters = await this._filterParser.replaceAllReferences(this._params.filters);
    const newFiltersString = JSON.stringify(newFilters);
    jsonQuery.push(await this._filterParser.perform(newFiltersString));
  }

  addSortToQuery(jsonQuery) {
    const order = this._params.sort.startsWith('-') ? -1 : 1;
    let sortParam = order > 0 ? this._params.sort : this._params.sort.substring(1);
    if (this._params.sort.split('.').length > 1) {
      [sortParam] = this._params.sort.split('.');
      const [association] = this._params.sort.split('.');
      this.addJoinToQuery(association, jsonQuery);
    }
    if (Flattener._isFieldFlattened(sortParam)) sortParam = Flattener.unflattenFieldName(sortParam);
    jsonQuery.push({ $sort: { [sortParam]: order } });

    return this;
  }

  addSkipAndLimitToQuery(jsonQuery) {
    jsonQuery.push({ $skip: this._getSkip() });
    jsonQuery.push({ $limit: this._getLimit() });

    return this;
  }

  addCountToQuery(jsonQuery) {
    if (Orm.hasRequiredVersion(this._opts.Mongoose, '3.4')) {
      jsonQuery.push({ $count: 'count' });
    } else {
      jsonQuery.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return this;
  }

  _hasPagination() {
    return this._params.page && this._params.page.number;
  }

  _getLimit() {
    return (this._hasPagination() && this._params.page.size
      ? Number.parseInt(this._params.page.size, 10) : 10);
  }

  _getSkip() {
    return (this._hasPagination()
      ? (Number.parseInt(this._params.page.number, 10) - 1) * this._getLimit() : 0);
  }

  hasSmartFieldSearch() {
    return this._searchBuilder.hasSmartFieldSearch;
  }

  getFieldsSearched() {
    return this._searchBuilder.getFieldsSearched();
  }

  async getQueryWithFiltersAndJoins(segment) {
    const jsonQuery = [];
    await this.addFiltersAndJoins(jsonQuery, segment);
    return jsonQuery;
  }

  async addFiltersAndJoins(jsonQuery, segment) {
    const conditions = [];

    if (this._params.filters) {
      await this._addFiltersToQuery(conditions);
    }

    if (this._params.search) {
      await this._searchBuilder.getWhere(conditions);
    }

    if (segment) {
      conditions.push(segment.where);
    }

    if (conditions.length) {
      jsonQuery.push({
        $match: {
          $and: conditions,
        },
      });
    }

    return this;
  }
}


module.exports = QueryBuilder;
