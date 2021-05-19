import _ from 'lodash';
import Interface from 'forest-express';
import moment from 'moment';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

class PieStatGetter {
  constructor(model, params, opts) {
    this._model = model;
    this._params = params;
    this._opts = opts;
    this._schema = Interface.Schemas.schemas[utils.getModelName(this._model)];
  }

  _getReference(fieldName) {
    const fieldNameWithoutSubField = fieldName.includes(':') ? fieldName.split(':')[0] : fieldName;
    const currentField = _.find(this._schema.fields, { field: fieldNameWithoutSubField });
    return currentField.reference ? currentField : null;
  }

  async perform() {
    const field = _.find(this._schema.fields, { field: this._params.group_by_field });
    const queryBuilder = new QueryBuilder(this._model, this._params, this._opts);
    const populateGroupByField = this._getReference(this._params.group_by_field);
    const groupByFieldName = populateGroupByField
      ? this._params.group_by_field.replace(':', '.') : this._params.group_by_field;

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    if (populateGroupByField) {
      queryBuilder.addJoinToQuery(populateGroupByField, jsonQuery);
    }

    const query = this._model.aggregate(jsonQuery);

    let sum = 1;
    if (this._params.aggregate_field) {
      sum = `$${this._params.aggregate_field}`;
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
