import { Schemas } from 'forest-express';
import _ from 'lodash';
import moment from 'moment';
import utils from '../utils/schema';
import getScopedParams from '../utils/scopes';
import QueryBuilder from './query-builder';

class PieStatGetter {
  constructor(model, params, opts, user) {
    this._model = model;
    this._params = params;
    this._opts = { Mongoose: this._model.base, connections: this._model.base.connections };
    this._user = user;
    this._schema = Schemas.schemas[utils.getModelName(this._model)];
  }

  _getReference(fieldName) {
    const fieldNameWithoutSubField = fieldName.includes(':') ? fieldName.split(':')[0] : fieldName;
    const currentField = _.find(this._schema.fields, { field: fieldNameWithoutSubField });
    return currentField.reference ? currentField : null;
  }

  async perform() {
    const params = await getScopedParams(this._params, this._model, this._user);
    const field = _.find(this._schema.fields, { field: params.groupByFieldName });
    const queryBuilder = new QueryBuilder(this._model, params, this._opts);
    const populateGroupByField = this._getReference(params.groupByFieldName);
    const groupByFieldName = populateGroupByField
      ? params.groupByFieldName.replace(':', '.') : params.groupByFieldName;

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    if (populateGroupByField) {
      queryBuilder.addJoinToQuery(populateGroupByField, jsonQuery);
    }

    const query = this._model.aggregate(jsonQuery);

    let sum = 1;
    if (params.aggregateFieldName) {
      sum = `$${params.aggregateFieldName}`;
    }

    const records = {
      value: await query
        .group({
          _id: `$${groupByFieldName}`,
          count: { $sum: sum },
        })
        .project({
          key: '$_id',
          value: '$count',
          _id: false,
        })
        .sort({ value: -1 })
        .exec(),
    };

    if (field && field.type === 'Date') {
      _.each(records.value, (record) => {
        record.key = moment(record.key).format('DD/MM/YYYY HH:mm:ss');
      });
    }

    return records;
  }
}

module.exports = PieStatGetter;
