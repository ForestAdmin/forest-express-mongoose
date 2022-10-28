import Interface from 'forest-express';
import _ from 'lodash';
import moment from 'moment-timezone';
import utils from '../utils/schema';
import getScopedParams from '../utils/scopes';
import QueryBuilder from './query-builder';

class LineStatGetter {
  constructor(model, params, opts, user) {
    this._model = model;
    this._params = params;
    this._opts = { Mongoose: this._model.base, connections: this._model.base.connections };
    this._user = user;
  }

  _getReference(fieldName) {
    if (!fieldName) { return null; }
    const schema = Interface.Schemas.schemas[utils.getModelName(this._model)];
    const fieldNameWithoutSubField = fieldName.includes(':') ? fieldName.split(':')[0] : fieldName;
    const field = _.find(schema.fields, { field: fieldNameWithoutSubField });
    return field.reference ? field : null;
  }

  static _getFormat(momentRange) {
    switch (momentRange) {
      case 'day': return 'DD/MM/YYYY';
      case 'week': return '[W]w-YYYY';
      case 'month': return 'MMM YY';
      case 'year': return 'YYYY';
      default: return null;
    }
  }

  static _formatLabel(record, momentRange) {
    switch (momentRange) {
      case 'day':
        return moment()
          .year(record._id.year)
          .month(record._id.month - 1)
          .startOf('month')
          .add(record._id.day - 1, 'days')
          .startOf(momentRange)
          .format(LineStatGetter._getFormat(momentRange));
      case 'week':
        return moment()
          .year(record._id.year)
          .week(record._id.week)
          .startOf(momentRange)
          .format(LineStatGetter._getFormat(momentRange));
      case 'month':
        return moment()
          .year(record._id.year)
          .month(record._id.month - 1)
          .startOf(momentRange)
          .format(LineStatGetter._getFormat(momentRange));
      case 'year':
        return record._id.year.toString();
      default:
        return null;
    }
  }

  static _setDate(record, momentRange) {
    switch (momentRange) {
      case 'day':
        return moment()
          .year(record._id.year)
          .month(record._id.month - 1)
          .startOf('month')
          .add(record._id.day - 1, 'days')
          .startOf(momentRange);
      case 'week':
        return moment().year(record._id.year)
          .week(record._id.week).startOf(momentRange);
      case 'month':
        return moment().year(record._id.year)
          .month(record._id.month - 1).startOf(momentRange);
      case 'year':
        return moment().year(record._id.year).startOf(momentRange);
      default:
        return null;
    }
  }

  static _fillEmptyIntervals(records, momentRange, firstDate, lastDate) {
    const newRecords = [];

    let currentDate = firstDate;
    while (currentDate <= lastDate) {
      const currentLabel = currentDate.format(LineStatGetter._getFormat(momentRange));
      const currentRecord = _.find(records, { label: currentLabel });
      const value = currentRecord ? currentRecord.values.value : 0;

      newRecords.push({ label: currentLabel, values: { value } });

      currentDate = currentDate.add(1, momentRange);
    }

    return newRecords;
  }

  async perform() {
    const params = await getScopedParams(this._params, this._model, this._user);
    const timezone = -parseInt(moment().tz(params.timezone).format('Z'), 10);
    const timezoneOffset = timezone * 60 * 60 * 1000;
    const queryBuilder = new QueryBuilder(this._model, params, this._opts);

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);

    const groupBy = {};
    const sort = {};

    if (params.groupByFieldName) {
      switch (params.timeRange) {
        case 'Day':
          groupBy.year = {
            $year: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          groupBy.month = {
            $month: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          groupBy.day = {
            $dayOfMonth: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          break;
        case 'Week':
          groupBy.week = {
            $week: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          groupBy.year = {
            $year: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          break;
        case 'Year':
          groupBy.year = {
            $year: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          break;
        default: // Month
          groupBy.month = {
            $month: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
          groupBy.year = {
            $year: [{
              $subtract: [`$${params.groupByFieldName}`, timezoneOffset],
            }],
          };
      }
      sort[params.groupByFieldName] = 1;
    }

    let sum = 1;
    if (params.aggregateFieldName) {
      sum = `$${params.aggregateFieldName}`;
    }

    if (params.groupByFieldName) {
      jsonQuery.push({
        $match: {
          [params.groupByFieldName]: { $ne: null },
        },
      });
    }

    if (groupBy) {
      jsonQuery.push({
        $group: {
          _id: groupBy,
          [params.groupByFieldName]: { $first: `$${params.groupByFieldName}` },
          count: { $sum: sum },
        },
      });
    }

    const query = this._model.aggregate(jsonQuery);

    let records = await query.sort(sort)
      .project({ values: { key: '$_id', value: '$count' } })
      .exec();

    if (!records.length) { return { value: [] }; }
    const momentRange = params.timeRange.toLowerCase();
    const firstDate = LineStatGetter._setDate(records[0], momentRange);
    const lastDate = LineStatGetter._setDate(records[records.length - 1], momentRange);

    records = records.map((record) => ({
      label: LineStatGetter._formatLabel(record, momentRange),
      values: record.values,
    }));

    return { value: LineStatGetter._fillEmptyIntervals(records, momentRange, firstDate, lastDate) };
  }
}

module.exports = LineStatGetter;
