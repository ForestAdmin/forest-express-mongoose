import QueryBuilder from './query-builder';

function ValueStatGetter(model, params, opts) {
  const queryBuilder = new QueryBuilder(model, params, opts);

  this.perform = async () => {
    let sum = 1;
    if (params.aggregate_field) {
      sum = `$${params.aggregate_field}`;
    }

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    const records = await model.aggregate(jsonQuery)
      .group({
        _id: null,
        total: { $sum: sum },
      })
      .exec();

    if (!records || !records.length) {
      return { value: 0 };
    }

    return { value: records[0].total };
  };
}

module.exports = ValueStatGetter;
