/* eslint-disable no-underscore-dangle */
import _ from 'lodash';
import P from 'bluebird';
import moment from 'moment';
import Interface from 'forest-express';
import QueryBuilder from './query-builder';
import utils from '../utils/schema';

function LineStatFinder(model, params, opts) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const timezone = (-parseInt(params.timezone, 10)).toString();
  const timezoneOffset = timezone * 60 * 60 * 1000;
  const queryBuilder = new QueryBuilder(model, params, opts);

  function getReference(fieldName) {
    if (!fieldName) { return null; }
    const fieldNameWithoutSubField = fieldName.includes(':') ? fieldName.split(':')[0] : fieldName;
    const field = _.find(schema.fields, { field: fieldNameWithoutSubField });
    return field.reference ? field : null;
  }

  function getFormat(momentRange) {
    switch (momentRange) {
      case 'day': return 'DD/MM/YYYY';
      case 'week': return '[W]w-YYYY';
      case 'month': return 'MMM YY';
      case 'year': return 'YYYY';
      default: return null;
    }
  }

  function formatLabel(record, momentRange) {
    switch (momentRange) {
      case 'day':
        return moment()
          .year(record._id.year)
          .month(record._id.month - 1)
          .startOf('month')
          .add(record._id.day - 1, 'days')
          .startOf(momentRange)
          .format(getFormat(momentRange));
      case 'week':
        return moment()
          .year(record._id.year)
          .week(record._id.week)
          .startOf(momentRange)
          .format(getFormat(momentRange));
      case 'month':
        return moment()
          .year(record._id.year)
          .month(record._id.month - 1)
          .startOf(momentRange)
          .format(getFormat(momentRange));
      case 'year':
        return record._id.year.toString();
      default:
        return null;
    }
  }

  function setDate(record, momentRange) {
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

  function fillEmptyIntervals(records, momentRange, firstDate, lastDate) {
    const newRecords = [];

    let currentDate = firstDate;
    while (currentDate <= lastDate) {
      const currentLabel = currentDate.format(getFormat(momentRange));
      const currentRecord = _.find(records, { label: currentLabel });
      const value = currentRecord ? currentRecord.values.value : 0;

      newRecords.push({ label: currentLabel, values: { value } });

      currentDate = currentDate.add(1, momentRange);
    }

    return newRecords;
  }

  this.perform = () => {
    const populateGroupByField = getReference(params.group_by_field);
    const groupByFieldName = populateGroupByField
      ? params.group_by_field.replace(':', '.') : params.group_by_field;

    return new P(async (resolve, reject) => {
      const jsonQuery = await queryBuilder.getQueryWithFiltersAndJoins(null);
      if (populateGroupByField) {
        queryBuilder.addJoinToQuery(populateGroupByField, jsonQuery);
      }

      const groupBy = {};
      const sort = {};

      if (groupByFieldName) {
        groupBy._id = `$${groupByFieldName}`;
      }

      if (params.group_by_date_field) {
        switch (params.time_range) {
          case 'Day':
            groupBy.year = {
              $year: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            groupBy.month = {
              $month: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            groupBy.day = {
              $dayOfMonth: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            break;
          case 'Week':
            groupBy.week = {
              $week: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            groupBy.year = {
              $year: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            break;
          case 'Year':
            groupBy.year = {
              $year: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            break;
          default: // Month
            groupBy.month = {
              $month: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
            groupBy.year = {
              $year: [{
                $subtract: [`$${params.group_by_date_field}`, timezoneOffset],
              }],
            };
        }
        sort[params.group_by_date_field] = 1;
      }

      let sum = 1;
      if (params.aggregate_field) {
        sum = `$${params.aggregate_field}`;
      }

      if (params.group_by_date_field) {
        jsonQuery.push({
          $match: {
            [params.group_by_date_field]: { $ne: null },
          },
        });
      }

      if (groupBy) {
        jsonQuery.push({
          $group: {
            _id: groupBy,
            [params.group_by_date_field]: { $first: `$${params.group_by_date_field}` },
            count: { $sum: sum },
          },
        });
      }

      const query = model.aggregate(jsonQuery);

      query.sort(sort)
        .project({ values: { key: '$_id', value: '$count' } })
        .exec((error, records) => (error ? reject(error) : resolve(records)));
    })
      .then((records) => {
        if (!records.length) { return { value: [] }; }
        const momentRange = params.time_range.toLowerCase();
        const firstDate = setDate(records[0], momentRange);
        const lastDate = setDate(records[records.length - 1], momentRange);

        records = records.map(record => ({
          label: formatLabel(record, momentRange),
          values: record.values,
        }));

        return { value: fillEmptyIntervals(records, momentRange, firstDate, lastDate) };
      });
  };
}

module.exports = LineStatFinder;
