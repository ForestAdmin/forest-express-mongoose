import _ from 'lodash';
import P from 'bluebird';
import Interface from 'forest-express';
import moment from 'moment';
import FiltersParser from './filters-parser';
import utils from '../utils/schema';

function PieStatGetter(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const field = _.find(schema.fields, { field: params.group_by_field });

  function getReference(fieldName) {
    const currentField = _.find(schema.fields, { field: fieldName });
    return currentField.reference ? currentField : null;
  }

  function handlePopulate(records, referenceField) {
    return new P((resolve, reject) => {
      const referenceModel = utils.getReferenceModel(opts, referenceField.reference);

      referenceModel.populate(records.value, { path: 'key' }, (err, currentRecords) => {
        if (err) { return reject(err); }
        return resolve({ value: currentRecords });
      });
    });
  }

  this.perform = () => {
    const populateGroupByField = getReference(params.group_by_field);

    return new P((resolve, reject) => {
      const groupBy = {};
      groupBy[params.group_by_field] = `$${params.group_by_field}`;

      const query = model.aggregate();

      if (params.filters) {
        query.match(new FiltersParser(model, params.timezone, opts).perform(params.filters));
      }

      let sum = 1;
      if (params.aggregate_field) {
        sum = `$${params.aggregate_field}`;
      }

      query
        .group({
          _id: groupBy,
          count: { $sum: sum },
        })
        .project({
          key: `$_id.${params.group_by_field}`,
          value: '$count',
          _id: false,
        })
        .sort({ value: -1 })
        .exec((err, records) => (err ? reject(err) : resolve({ value: records })));
    }).then((records) => {
      if (populateGroupByField) {
        return handlePopulate(records, populateGroupByField);
      } else if (field.type === 'Date') {
        _.each(records.value, (record) => {
          record.key = moment(record.key).format('DD/MM/YYYY HH:mm:ss');
        });
      }
      return records;
    });
  };
}

module.exports = PieStatGetter;
