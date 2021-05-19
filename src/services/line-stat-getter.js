import _ from 'lodash';
import moment from 'moment-timezone';
import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

class LineStatGetter {
  constructor(model, params, opts) {
    this._model = model;
    this._params = params;
    this._opts = opts;
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
    const timezone = -parseInt(moment().tz(this._params.timezone).format('Z'), 10);
    const timezoneOffset = timezone * 60 * 60 * 1000;
    const queryBuilder = new QueryBuilder(this._model, this._params, this._opts);

    const populateGroupByField = this._getReference(this._params.group_by_field);
    const groupByFieldName = populateGroupByField
      ? this._params.group_by_field.replace(':', '.') : this._params.group_by_field;

    const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
    if (populateGroupByField) {
      queryBuilder.addJoinToQuery(populateGroupByField, jsonQuery);
    }

    const groupBy = {};
    const sort = {};

    if (groupByFieldName) {
      groupBy._id = `$${groupByFieldName}`;
    }

    if (this._params.group_by_date_field) {
      switch (this._params.time_range) {
        case 'Day':
          groupBy.year = {
            $year: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          groupBy.month = {
            $month: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          groupBy.day = {
            $dayOfMonth: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          break;
        case 'Week':
          groupBy.week = {
            $week: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          groupBy.year = {
            $year: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          break;
        case 'Year':
          groupBy.year = {
            $year: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          break;
        default: // Month
          groupBy.month = {
            $month: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
          groupBy.year = {
            $year: [{
              $subtract: [`$${this._params.group_by_date_field}`, timezoneOffset],
            }],
          };
      }
      sort[this._params.group_by_date_field] = 1;
    }

    let sum = 1;
    if (this._params.aggregate_field) {
      sum = `$${this._params.aggregate_field}`;
    }

    if (this._params.group_by_date_field) {
      jsonQuery.push({
        $match: {
          [this._params.group_by_date_field]: { $ne: null },
        },
      });
    }

    if (groupBy) {
      jsonQuery.push({
        $group: {
          _id: groupBy,
          [this._params.group_by_date_field]: { $first: `$${this._params.group_by_date_field}` },
          count: { $sum: sum },
        },
      });
    }

    const query = this._model.aggregate(jsonQuery);

    let records = await query.sort(sort)
      .project({ values: { key: '$_id', value: '$count' } })
      .exec();

    if (!records.length) { return { value: [] }; }
    const momentRange = this._params.time_range.toLowerCase();
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
