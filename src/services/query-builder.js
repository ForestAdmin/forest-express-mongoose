import _ from 'lodash';
import Interface from 'forest-express';
import utils from '../utils/schema';
import Orm from '../utils/orm';
import OperatorValueParser from './operator-value-parser';
import SearchBuilder from './search-builder';
import FilterParser from './filter-parser';

function QueryBuilder(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);

  let { filter } = params;
  if (params.filters && params.filters.length) {
    filter = {};
    params.filters.forEach((condition) => {
      if (filter[condition.field]) {
        filter[condition.field] += `,${condition.value}`;
      } else {
        filter[condition.field] = `${condition.value}`;
      }
    });
  }

  this.addJoinToQuery = (field, joinQuery) => {
    if (field.reference) {
      if (_.find(joinQuery, join => join && join.$lookup && join.$lookup.as === field.field)) {
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

      if (model.schema.path(field.field).instance !== 'Array') {
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

  this.getWhereForReferenceField = (field) => {
    const conditions = [];

    _.each(filter, (values, key) => {
      if (key.indexOf(':') > -1) {
        const splitted = key.split(':');
        const fieldName = splitted[0];
        const subFieldName = splitted[1];

        if (fieldName === field.field && field.reference) {
          // NOTICE: Look for the associated model infos
          const subModel = utils.getReferenceModel(opts, field.reference);

          values.split(',').forEach((value) => {
            const condition = {};
            condition[`${field.field}.${subFieldName}`] = new OperatorValueParser(opts, params.timezone)
              .perform(subModel, subFieldName, value);
            conditions.push(condition);
          });
        }
      }
    });

    if (params.filterType && conditions.length > 0) {
      return { [`$${params.filterType}`]: conditions };
    }
    return null;
  };

  this.joinAllReferences = (jsonQuery) => {
    schema.fields.forEach(field => this.addJoinToQuery(field, jsonQuery));
    return this;
  };

  this.addFiltersToQuery = (jsonQuery, joinQuery) => {
    const operator = `$${params.filterType}`;
    const conditions = [];

    _.each(filter, (values, key) => {
      const filterConditions = new FilterParser(model, opts, params.timezone).perform(key, values);
      _.each(filterConditions, condition => conditions.push(condition));
    });

    _.each(schema.fields, (field) => {
      if (field.reference) {
        const condition = this.getWhereForReferenceField(field);
        if (condition) {
          conditions.push(condition);

          if (joinQuery) {
            this.addJoinToQuery(field, joinQuery);
          }
        }
      }
    });

    if (conditions.length) {
      jsonQuery.push({ [operator]: conditions });
    }

    return this;
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

  this.getQueryWithFiltersAndJoins = (segment, joinFromFilter) => {
    const joinQuery = [];
    const jsonQuery = [];

    if (!joinFromFilter) {
      this.joinAllReferences(joinQuery);
    }

    const conditions = [];
    if (params.search) {
      searchBuilder.getWhere(conditions);
    }

    if (filter) {
      this.addFiltersToQuery(conditions, joinFromFilter ? joinQuery : null);
    }

    if (segment) {
      conditions.push(segment.where);
    }

    if (joinQuery.length) {
      joinQuery.forEach(join => jsonQuery.push(join));
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
