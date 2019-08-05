import _ from 'lodash';
import P from 'bluebird';
import Interface from 'forest-express';
import moment from 'moment';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

function PieStatGetter(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const field = _.find(schema.fields, { field: params.group_by_field });
  const queryBuilder = new QueryBuilder(model, params, opts);

  function getReference(fieldName) {
    const fieldNameWithoutSubField = fieldName.includes(':') ? fieldName.split(':')[0] : fieldName;
    const currentField = _.find(schema.fields, { field: fieldNameWithoutSubField });
    return currentField.reference ? currentField : null;
  }

  this.perform = () => {
    const populateGroupByField = getReference(params.group_by_field);
    const groupByFieldName = populateGroupByField
      ? params.group_by_field.replace(':', '.') : params.group_by_field;

    return new P((resolve, reject) => {
      const jsonQuery = queryBuilder.getQueryWithFiltersAndJoins(null, true);
      if (populateGroupByField) {
        queryBuilder.addJoinToQuery(populateGroupByField, jsonQuery);
      }

      const query = model.aggregate(jsonQuery);

      let sum = 1;
      if (params.aggregate_field) {
        sum = `$${params.aggregate_field}`;
      }

      query
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
        .exec((err, records) => (err ? reject(err) : resolve({ value: records })));
    }).then((records) => {
      if (field && field.type === 'Date') {
        _.each(records.value, (record) => {
          record.key = moment(record.key).format('DD/MM/YYYY HH:mm:ss');
        });
      }
      return records;
    });
  };
}

module.exports = PieStatGetter;
