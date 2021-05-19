import _ from 'lodash';
import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

function ResourcesGetter(model, opts, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const queryBuilder = new QueryBuilder(model, params, opts);

  function getSegment() {
    if (schema.segments && params.segment) {
      return _.find(schema.segments, (currentSegment) => currentSegment.name === params.segment);
    }
    return null;
  }

  async function getSegmentCondition() {
    const segment = getSegment();

    if (segment && segment.where && typeof segment.where === 'function') {
      const where = await segment.where();
      return { where };
    }

    return segment;
  }

  this.perform = async () => {
    let fieldsSearched = null;
    const segment = await getSegmentCondition();
    const jsonQuery = [];
    await queryBuilder.addFiltersAndJoins(jsonQuery, segment);

    if (params.search) {
      fieldsSearched = queryBuilder.getFieldsSearched();
      if (fieldsSearched.length === 0 && !queryBuilder.hasSmartFieldSearch()) {
        // NOTICE: No search condition has been set for the current search,
        //         no record can be found.
        return [[], []];
      }
    }

    if (params.sort) {
      queryBuilder.addSortToQuery(jsonQuery);
    }

    await queryBuilder.addProjection(jsonQuery);
    queryBuilder.addSkipAndLimitToQuery(jsonQuery);
    await queryBuilder.joinAllReferences(jsonQuery);

    const records = await model.aggregate(jsonQuery);
    return [records, fieldsSearched];
  };

  this.count = async () => {
    const segment = await getSegmentCondition();
    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(segment);
    queryBuilder.addCountToQuery(jsonQuery);

    const result = await model.aggregate(jsonQuery);
    return result[0] ? result[0].count : 0;
  };
}

module.exports = ResourcesGetter;
