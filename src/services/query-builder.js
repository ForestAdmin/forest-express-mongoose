import _ from 'lodash';
import Interface, { BaseFiltersParser } from 'forest-express';
import utils from '../utils/schema';
import Orm from '../utils/orm';
import SearchBuilder from './search-builder';
import FiltersParser from './filters-parser';

function QueryBuilder(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);

  const { filters } = params;

  this.joinAlreadyExists = (field, joinQuery) => !!_.find(joinQuery, join => join && join.$lookup && join.$lookup.as === field.field)

  this.addJoinToQuery = (field, joinQuery) => {
    if (field.reference && !field.isVirtual && !field.integration) {
      if (this.joinAlreadyExists(field, joinQuery)) {
        return this;
      }

      const referencedKey = field.reference.split('.')[1];
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

  this.joinAllReferences = (jsonQuery, alreadyJoinedQuery) => {
    schema.fields.forEach(field => {
      if (this.joinAlreadyExists(field, alreadyJoinedQuery)) { return; }
      this.addJoinToQuery(field, jsonQuery);
    });
    return this;
  };

  this.addFiltersToQuery = (jsonQuery, joinQuery) => {
    jsonQuery.push(new FiltersParser(model, params.timezone, opts).perform(filters));
    if (joinQuery) {
      BaseFiltersParser.getAssociations(filters).forEach((associationString) => {
        const field = _.find(schema.fields, currentField =>
          currentField.field === associationString && currentField.reference);
        this.addJoinToQuery(field, joinQuery);
      });
    }
  };

  this.addSortToQuery = (jsonQuery) => {
    const order = params.sort.startsWith('-') ? -1 : 1;
    let sortParam = order > 0 ? params.sort : params.sort.substring(1);
    if (params.sort.split('.').length > 1) {
      sortParam = params.sort.split('.')[0];
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
    if (Orm.hasRequiredVersion(opts.mongoose, '3.4')) {
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

  this.getQueryWithFiltersAndJoins = (segment) => {
    const requiredJoinQuery = [];
    const jsonQuery = [];
    const conditions = [];

    if (filters) {
      this.addFiltersToQuery(conditions, requiredJoinQuery);
    }

    if (params.search) {
      searchBuilder.getWhere(conditions);
    }

    if (segment) {
      conditions.push(segment.where);
    }

    if (requiredJoinQuery.length) {
      requiredJoinQuery.forEach(join => jsonQuery.push(join));
    }

    if (conditions.length) {
      jsonQuery.push({
        $match: {
          $and: conditions,
        },
      });
    }

    return jsonQuery;
  };
}

module.exports = QueryBuilder;
