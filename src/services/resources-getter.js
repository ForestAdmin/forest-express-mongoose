import P from 'bluebird';
import _ from 'lodash';
import Interface from 'forest-express';
import QueryParamsToOrmParams from './query-params-to-orm-params';
import utils from '../utils/schema';

function ResourcesGetter(model, opts, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  let fieldsSearched = null;
  let segment;

  const queryParamsToOrmParams = new QueryParamsToOrmParams(model, params, opts);
  let hasSmartFieldSearch = false;

  function getRecordsQuery() {
    const jsonQuery = queryParamsToOrmParams.getQueryWithFiltersAndJoin(segment);

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

      if (params.search) {
        fieldsSearched = queryParamsToOrmParams.getFieldsSearched();
        if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
          // NOTICE: No search condition has been set for the current search,
          //         no record can be found.
          return [];
        }
      }

      if (params.sort) {
        queryParamsToOrmParams.addSortToQuery(jsonQuery);
      }

      queryParamsToOrmParams.addSkipAndLimitToQuery(jsonQuery);

      return model.aggregate(jsonQuery);
    })
    .then(records => [records, fieldsSearched]);

  this.count = () => getSegmentCondition()
    .then(() => {
      const jsonQuery = getRecordsQuery();
      queryParamsToOrmParams.addCountToQuery(jsonQuery);
      return model.aggregate(jsonQuery)
        .then(result => result[0].count);
    });
}

module.exports = ResourcesGetter;
