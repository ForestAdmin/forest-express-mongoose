import _ from 'lodash';
import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';
import getScopedParams from '../utils/scopes';

class ResourcesGetter {
  constructor(model, opts, params, user) {
    this._model = model;
    this._opts = { Mongoose: this._model.base, connections: this._model.base.connections };
    this._params = params;
    this._user = user;
  }

  _getSegment() {
    const schema = Interface.Schemas.schemas[utils.getModelName(this._model)];
    if (schema.segments && this._params.segment) {
      return _.find(
        schema.segments,
        (currentSegment) => currentSegment.name === this._params.segment,
      );
    }
    return null;
  }

  async _getSegmentCondition() {
    const segment = this._getSegment();

    if (segment && segment.where && typeof segment.where === 'function') {
      const where = await segment.where();
      return { where };
    }

    return segment;
  }

  async perform() {
    const params = await getScopedParams(this._params, this._model, this._user);

    let fieldsSearched = null;
    const segment = await this._getSegmentCondition();
    const jsonQuery = [];
    const queryBuilder = new QueryBuilder(this._model, params, this._opts);

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

    const records = await this._model.aggregate(jsonQuery);
    return [records, fieldsSearched];
  }

  async count() {
    const params = await getScopedParams(this._params, this._model, this._user);
    const segment = await this._getSegmentCondition();

    const queryBuilder = new QueryBuilder(this._model, params, this._opts);
    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(segment);
    queryBuilder.addCountToQuery(jsonQuery);

    const result = await this._model.aggregate(jsonQuery);
    return result[0] ? result[0].count : 0;
  }
}

module.exports = ResourcesGetter;
