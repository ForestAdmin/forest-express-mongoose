import P from 'bluebird';
import QueryParamsToOrmParams from './query-params-to-orm-params';

function ValueStatGetter(model, params, opts) {
  const queryParamsToOrmParams = new QueryParamsToOrmParams(model, params, opts);

  this.perform = () => new P((resolve, reject) => {
    const jsonQuery = queryParamsToOrmParams.getQueryWithFiltersAndJoin(null, true);
    const query = model.aggregate(jsonQuery);

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
