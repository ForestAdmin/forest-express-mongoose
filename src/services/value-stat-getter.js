import getScopedParams from '../utils/scopes';
import QueryBuilder from './query-builder';

class ValueStatGetter {
  constructor(model, params, opts, user) {
    this._model = model;
    this._params = params;
    this._opts = opts;
    this._user = user;
  }

  async perform() {
    const params = await getScopedParams(this._params, this._model, this._user);
    const queryBuilder = new QueryBuilder(this._model, params, this._opts);

    let sum = 1;
    if (params.aggregateFieldName) {
      sum = `$${params.aggregateFieldName}`;
    }

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    const records = await this._model
      .aggregate(jsonQuery)
      .group({ _id: null, total: { $sum: sum } })
      .exec();

    if (!records || !records.length) {
      return { value: { countCurrent: 0 } };
    }

    return { value: { countCurrent: records[0].total } };
  }
}

module.exports = ValueStatGetter;
