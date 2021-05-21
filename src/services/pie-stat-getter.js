import { Schemas, scopeManager } from 'forest-express';
import _ from 'lodash';
import moment from 'moment';
import utils from '../utils/schema';
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
    const params = {
      ...this._params,
      filters: await scopeManager.appendScopeForUser(
        this._params.filters,
        this._user,
        utils.getModelName(this._model),
      ),
    };

    const field = _.find(this._schema.fields, { field: params.group_by_field });
    const queryBuilder = new QueryBuilder(this._model, params, this._opts);
    const populateGroupByField = this._getReference(params.group_by_field);
    const groupByFieldName = populateGroupByField
      ? params.group_by_field.replace(':', '.') : params.group_by_field;

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    if (populateGroupByField) {
      queryBuilder.addJoinToQuery(populateGroupByField, jsonQuery);
    }

    const query = this._model.aggregate(jsonQuery);

    let sum = 1;
    if (params.aggregate_field) {
      sum = `$${params.aggregate_field}`;
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
