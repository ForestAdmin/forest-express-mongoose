import P from 'bluebird';
import _ from 'lodash';
import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

function ResourcesGetter(model, opts, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const queryBuilder = new QueryBuilder(model, params, opts);

  let fieldsSearched = null;

  function getSegment() {
    if (schema.segments && params.segment) {
      return _.find(schema.segments, currentSegment => currentSegment.name === params.segment);
    }
    return null;
  }

  function getSegmentCondition() {
    const segment = getSegment();
    if (segment && segment.where && typeof segment.where === 'function') {
      return segment.where().then(where => ({ where }));
    }
    return new P(resolve => resolve(segment));
  }

  this.perform = () => getSegmentCondition()
    .then(async (segment) => {
      const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(segment);

      if (params.search) {
        fieldsSearched = queryBuilder.getFieldsSearched();
        if (fieldsSearched.length === 0 && !queryBuilder.hasSmartFieldSearch()) {
          // NOTICE: No search condition has been set for the current search,
          //         no record can be found.
          return [];
        }
      }

      if (params.sort) {
        queryBuilder.addSortToQuery(jsonQuery);
      }

      queryBuilder.addSkipAndLimitToQuery(jsonQuery);

      queryBuilder.joinAllReferences(jsonQuery);

      return model.aggregate(jsonQuery);
    })
    .then(records => [records, fieldsSearched]);

  this.count = () => getSegmentCondition()
    .then(async (segment) => {
      const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(segment);
      queryBuilder.addCountToQuery(jsonQuery);
      return model.aggregate(jsonQuery)
        .then(result => (result[0] ? result[0].count : 0));
    });
}

module.exports = ResourcesGetter;
