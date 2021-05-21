import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

class ValueStatGetter {
  constructor(model, params, opts) {
    this._model = model;
    this._params = params;
    this._opts = opts;
  }

  async _getScopedParams() {
    return {
      ...this._params,
      filters: await Interface.scopeManager.appendScopeForUser(
        this._params.filters,
        this._user,
        utils.getModelName(this._model),
      ),
    };
  }

  async perform() {
    const params = await this._getScopedParams();
    const queryBuilder = new QueryBuilder(this._model, params, this._opts);

    let sum = 1;
    if (params.aggregate_field) {
      sum = `$${params.aggregate_field}`;
    }

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    const records = await this._model.aggregate(jsonQuery)
      .group({
        _id: null,
        total: { $sum: sum },
      })
      .exec();

    if (!records || !records.length) {
      return { value: 0 };
    }

    return { value: records[0].total };
  }
}

module.exports = ValueStatGetter;
