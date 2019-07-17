import _ from 'lodash';
import P from 'bluebird';
import FilterParser from './filter-parser';

function ValueStatGetter(model, params, opts) {
  this.perform = () => new P((resolve, reject) => {
    const query = model.aggregate();

    if (params.filterType && params.filters) {
      const operator = `$${params.filterType}`;
      const queryFilters = {};
      queryFilters[operator] = [];

      _.each(params.filters, (filter) => {
        const conditions = new FilterParser(model, opts, params.timezone)
          .perform(filter.field, filter.value);
        _.each(conditions, condition => queryFilters[operator].push(condition));
      });

      query.match(queryFilters);
    }

    let sum = 1;
    if (params.aggregate_field) {
      sum = `$${params.aggregate_field}`;
    }

    query
      .group({
        _id: null,
        total: { $sum: sum },
      })
      .exec((err, records) => {
        if (err) { return reject(err); }
        if (!records || !records.length) { return resolve({ value: 0 }); }

        return resolve({ value: records[0].total });
      });
  });
}

module.exports = ValueStatGetter;
