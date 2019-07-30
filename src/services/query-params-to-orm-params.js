import _ from 'lodash';
import Interface from 'forest-express';
import utils from '../utils/schema';
import Orm from '../utils/orm';
import mongooseUtils from './mongoose-utils';
import OperatorValueParser from './operator-value-parser';
import SearchBuilder from './search-builder';
import FilterParser from './filter-parser';

function QueryParamsToOrmParams(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);

  this.getWhereForReferenceField = (field) => {
    const conditions = [];

    _.each(params.filter, (values, key) => {
      if (key.indexOf(':') > -1) {
        const splitted = key.split(':');
        const fieldName = splitted[0];
        const subFieldName = splitted[1];

        if (fieldName === field.field && field.reference) {
          // NOTICE: Look for the associated model infos
          const subModel = _.find(mongooseUtils.getModels(opts), currentModel =>
            utils.getModelName(currentModel) === field.reference.split('.')[0]);

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

  this.joinNeededReferences = (jsonQuery) => {
    _.each(schema.fields, (field) => {
      if (field.reference) {
        const [collectionName, referencedKey] = field.reference.split('.');
        const subModel = _.find(mongooseUtils.getModels(opts), currentModel =>
          utils.getModelName(currentModel) === collectionName);
        jsonQuery.push({
          $lookup: {
            from: subModel.collection.name,
            localField: field.field,
            foreignField: referencedKey,
            as: field.field,
          },
        });

        if (model.schema.path(field.field).instance !== 'Array') {
          jsonQuery.push({
            $unwind: {
              path: `$${field.field}`,
              preserveNullAndEmptyArrays: true,
            },
          });
        }
      }
    });
  };

  this.addFiltersToQuery = (jsonQuery) => {
    const operator = `$${params.filterType}`;
    const conditions = [];

    _.each(params.filter, (values, key) => {
      const filterConditions = new FilterParser(model, opts, params.timezone).perform(key, values);
      _.each(filterConditions, condition => conditions.push(condition));
    });

    _.each(schema.fields, (field) => {
      if (field.reference) {
        const condition = this.getWhereForReferenceField(field);
        if (condition) {
          conditions.push(condition);
        }
      }
    });

    if (conditions.length) {
      jsonQuery.push({ [operator]: conditions });
    }
  };

  this.addSortToQuery = (jsonQuery) => {
    const order = params.sort.startsWith('-') ? -1 : 1;
    let sortParam = order > 0 ? params.sort : params.sort.substring(1);
    if (params.sort.split('.').length > 1) {
      sortParam = params.sort.split('.')[0];
    }
    jsonQuery.push({ $sort: { [sortParam]: order } });
  };

  this.addSkipAndLimitToQuery = (jsonQuery) => {
    jsonQuery.push({ $skip: this.getSkip() });
    jsonQuery.push({ $limit: this.getLimit() });
  };

  this.hasPagination = () => params.page && params.page.number;

  this.getLimit = () => (this.hasPagination() && params.page.size
    ? Number.parseInt(params.page.size, 10) : 10);

  this.getSkip = () => (this.hasPagination()
    ? (Number.parseInt(params.page.number, 10) - 1) * this.getLimit() : 0);

  this.getFieldsSearched = () => searchBuilder.getFieldsSearched();

  this.getQueryWithFiltersAndJoin = (segment) => {
    const jsonQuery = [];
    this.joinNeededReferences(jsonQuery);

    const conditions = [];
    if (params.search) {
      searchBuilder.getWhere(conditions);
    }

    if (params.filter) {
      this.addFiltersToQuery(conditions);
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

    return jsonQuery;
  };

  this.addCountToQuery = (jsonQuery) => {
    if (Orm.hasRequiredVersion(opts.mongoose, '3.4')) {
      jsonQuery.push({ $count: 'count' });
    } else {
      jsonQuery.push({ $group: { _id: null, count: { $sum: 1 } } });
    }
  };
}

module.exports = QueryParamsToOrmParams;
