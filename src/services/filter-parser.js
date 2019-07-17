import _ from 'lodash';
import Interface from 'forest-express';
import OperatorValueParser from './operator-value-parser';
import utils from '../utils/schema';

function FilterParser(model, opts, timezone) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];

  this.perform = (key, values) => {
    const conditions = [];

    const fieldValues = key.split(':');
    const fieldName = fieldValues[0];
    const subfieldName = fieldValues[1];

    const field = _.find(schema.fields, { field: fieldName });

    const isEmbeddedField = !!field.type.fields;
    if (subfieldName && !isEmbeddedField) { return []; }

    values.split(',').forEach((value) => {
      const condition = {};
      const filter = new OperatorValueParser(opts, timezone)
        .perform(model, key, value);

      if (isEmbeddedField) {
        condition[`${fieldName}.${subfieldName}`] = filter;
      } else {
        condition[key] = filter;
      }

      conditions.push(condition);
    });

    return conditions;
  };
}

module.exports = FilterParser;
