import _ from 'lodash';
import Interface from 'forest-express';
import utils from '../utils/schema';
import Orm from '../utils/orm';
import SearchBuilder from './search-builder';
import FiltersParser from './filters-parser';
import ProjectionBuilder from './projection-builder';

function QueryBuilder(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);
  const filterParser = new FiltersParser(model, params.timezone, opts);
  const projectionBuilder = new ProjectionBuilder(schema);

  const { filters } = params;

  this.joinAlreadyExists = (field, joinQuery) =>
    !!_.find(joinQuery, (join) => join && join.$lookup && join.$lookup.as === field.field);

  this.getFieldNamesRequested = async () => {
    if (!params.fields || !params.fields[model.collection.name]) { return null; }

    // NOTICE: Populate the necessary associations for filters
    const associations = params.filters ? await filterParser.getAssociations(params.filters) : [];

    if (params.sort && params.sort.includes('.')) {
      let [associationFromSorting] = params.sort.split('.');
      if (associationFromSorting[0] === '-') {
        associationFromSorting = associationFromSorting.substring(1);
      }
      associations.push(associationFromSorting);
    }

    return _.union(
      params.fields[model.collection.name].split(','),
      associations,
    );
  };

  this.addProjection = (jsonQuery) => this.getFieldNamesRequested()
    .then((fieldNames) => projectionBuilder.getProjection(fieldNames))
    .then((projection) => projection && jsonQuery.push(projection));

  this.addJoinToQuery = (field, joinQuery) => {
    if (field.reference && !field.isVirtual && !field.integration) {
      if (this.joinAlreadyExists(field, joinQuery)) {
        return this;
      }

      const referencedKey = utils.getReferenceField(field.reference);
      const subModel = utils.getReferenceModel(opts, field.reference);
      joinQuery.push({
        $lookup: {
          from: subModel.collection.name,
          localField: field.field,
          foreignField: referencedKey,
          as: field.field,
        },
      });

      const fieldPath = field.field && model.schema.path(field.field);
      if (fieldPath && fieldPath.instance !== 'Array') {
        joinQuery.push({
          $unwind: {
            path: `$${field.field}`,
            preserveNullAndEmptyArrays: true,
          },
        });
      }
    }

    return this;
  };

  this.joinAllReferences = async (jsonQuery, alreadyJoinedQuery) => {
    const fieldNames = await this.getFieldNamesRequested();
    schema.fields.forEach((field) => {
      if ((fieldNames && !fieldNames.includes(field.field))
        || this.joinAlreadyExists(field, alreadyJoinedQuery)) {
        return;
      }
      this.addJoinToQuery(field, jsonQuery);
    });
    return this;
  };

  this.addFiltersToQuery = async (jsonQuery) => {
    const newFilters = await filterParser.replaceAllReferences(filters);
    const newFiltersString = JSON.stringify(newFilters);
    jsonQuery.push(await filterParser.perform(newFiltersString));
  };

  this.addSortToQuery = (jsonQuery) => {
    const order = params.sort.startsWith('-') ? -1 : 1;
    let sortParam = order > 0 ? params.sort : params.sort.substring(1);
    if (params.sort.split('.').length > 1) {
      [sortParam] = params.sort.split('.');
      const [association] = params.sort.split('.');
      this.addJoinToQuery(association, jsonQuery);
    }
    jsonQuery.push({ $sort: { [sortParam]: order } });

    return this;
  };

  this.addSkipAndLimitToQuery = (jsonQuery) => {
    jsonQuery.push({ $skip: this.getSkip() });
    jsonQuery.push({ $limit: this.getLimit() });

    return this;
  };

  this.addCountToQuery = (jsonQuery) => {
    if (Orm.hasRequiredVersion(opts.Mongoose, '3.4')) {
      jsonQuery.push({ $count: 'count' });
    } else {
      jsonQuery.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return this;
  };

  this.hasPagination = () => params.page && params.page.number;

  this.getLimit = () => (this.hasPagination() && params.page.size
    ? Number.parseInt(params.page.size, 10) : 10);

  this.getSkip = () => (this.hasPagination()
    ? (Number.parseInt(params.page.number, 10) - 1) * this.getLimit() : 0);

  this.hasSmartFieldSearch = () => searchBuilder.hasSmartFieldSearch;

  this.getFieldsSearched = () => searchBuilder.getFieldsSearched();

  this.getQueryWithFiltersAndJoins = async (segment) => {
    const jsonQuery = [];
    await this.addFiltersAndJoins(jsonQuery, segment);
    return jsonQuery;
  };

  this.addFiltersAndJoins = async (jsonQuery, segment) => {
    const conditions = [];

    if (filters) {
      await this.addFiltersToQuery(conditions);
    }

    if (params.search) {
      await searchBuilder.getWhere(conditions);
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
  };
}

module.exports = QueryBuilder;
