import P from 'bluebird';
import _ from 'lodash';
import Interface from 'forest-express';
import OperatorValueParser from './operator-value-parser';
import SearchBuilder from './search-builder';
import FilterParser from './filter-parser';
import utils from '../utils/schema';
import mongooseUtils from './mongoose-utils';

function ResourcesGetter(model, opts, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  let segment;

  const searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);
  let hasSmartFieldSearch = false;

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    return hasPagination() && params.page.size ? parseInt(params.page.size, 10) : 10;
  }

  function getSkip() {
    return hasPagination() ? (parseInt(params.page.number, 10) - 1) * getLimit() : 0;
  }

  function populateWhere(field) {
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
  }

  function handlePopulate(jsonQuery) {
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
            $unwind: `$${field.field}`,
          });
        }
      }
    });
  }

  function handleFilterParams(jsonQuery) {
    const operator = `$${params.filterType}`;
    const conditions = [];

    _.each(params.filter, (values, key) => {
      const filterConditions = new FilterParser(model, opts, params.timezone).perform(key, values);
      _.each(filterConditions, condition => conditions.push(condition));
    });

    _.each(schema.fields, (field) => {
      if (field.reference) {
        const condition = populateWhere(field);
        if (condition) {
          conditions.push(condition);
        }
      }
    });

    if (conditions.length) {
      jsonQuery.push({ [operator]: conditions });
    }
  }

  function handleSortParam(jsonQuery) {
    const order = params.sort.startsWith('-') ? -1 : 1;
    let sortParam = order > 0 ? params.sort : params.sort.substring(1);
    if (params.sort.split('.').length > 1) {
      sortParam = params.sort.split('.')[0];
    }
    jsonQuery.push({ $sort: { [sortParam]: order } });
  }

  function getRecordsQuery() {
    const jsonQuery = [];
    handlePopulate(jsonQuery);

    const conditions = [];
    if (params.search) {
      searchBuilder.getWhere(conditions);
    }

    if (params.filter) {
      handleFilterParams(conditions);
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

    const where = condition => jsonQuery.push({ $match: condition });
    if (params.search) {
      _.each(schema.fields, (field) => {
        if (field.search) {
          try {
            field.search({ where }, params.search);
            hasSmartFieldSearch = true;
          } catch (error) {
            Interface.logger.error(`Cannot search properly on Smart Field ${field.field}`, error);
          }
        }
      });
    }

    return jsonQuery;
  }

  function getSegment() {
    if (schema.segments && params.segment) {
      segment = _.find(schema.segments, currentSegment => currentSegment.name === params.segment);
    }
  }

  function getSegmentCondition() {
    getSegment();
    if (segment && segment.where && typeof segment.where === 'function') {
      return segment.where()
        .then((where) => {
          segment.where = where;
        });
    }
    return new P(resolve => resolve());
  }

  this.perform = () => getSegmentCondition()
    .then(() => {
      const jsonQuery = getRecordsQuery();
      if (params.sort) {
        handleSortParam(jsonQuery);
      }

      jsonQuery.push({ $skip: getSkip() });
      jsonQuery.push({ $limit: getLimit() });

      return model.aggregate(jsonQuery);
    })
    .then((records) => {
      let fieldsSearched = null;

      if (params.search) {
        fieldsSearched = searchBuilder.getFieldsSearched();
        if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
          // NOTICE: No search condition has been set for the current search,
          //         no record can be found.
          return [[], 0];
        }
      }

      return [records, fieldsSearched];
    });

  this.count = () => getSegmentCondition()
    .then(() => {
      const jsonQuery = getRecordsQuery();
      jsonQuery.push({ $group: { _id: null, count: { $sum: 1 } } });
      return model.aggregate(jsonQuery)
        .then(result => result[0].count);
    });
}

module.exports = ResourcesGetter;
