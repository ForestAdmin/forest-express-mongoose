import _ from 'lodash';
import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

class ResourcesGetter {
  constructor(model, opts, params) {
    this._model = model;
    this._opts = opts;
    this._params = params;
    this._queryBuilder = new QueryBuilder(this._model, this._params, this._opts);
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
    let fieldsSearched = null;
    const segment = await this._getSegmentCondition();
    const jsonQuery = [];
    await this._queryBuilder.addFiltersAndJoins(jsonQuery, segment);

    if (this._params.search) {
      fieldsSearched = this._queryBuilder.getFieldsSearched();
      if (fieldsSearched.length === 0 && !this._queryBuilder.hasSmartFieldSearch()) {
        // NOTICE: No search condition has been set for the current search,
        //         no record can be found.
        return [[], []];
      }
    }

    if (this._params.sort) {
      this._queryBuilder.addSortToQuery(jsonQuery);
    }

    await this._queryBuilder.addProjection(jsonQuery);
    this._queryBuilder.addSkipAndLimitToQuery(jsonQuery);
    await this._queryBuilder.joinAllReferences(jsonQuery);

    const records = await this._model.aggregate(jsonQuery);
    return [records, fieldsSearched];
  }

  async count() {
    const segment = await this._getSegmentCondition();
    const jsonQuery = await this._queryBuilder.getQueryWithFiltersAndJoins(segment);
    this._queryBuilder.addCountToQuery(jsonQuery);

    const result = await this._model.aggregate(jsonQuery);
    return result[0] ? result[0].count : 0;
  }
}

module.exports = ResourcesGetter;
