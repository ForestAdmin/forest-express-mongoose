import _ from 'lodash';
import moment from 'moment';
import Interface from 'forest-express';
import utils from '../utils/schema';

const PERIODS_PAST = '$past';
const PERIODS_FUTURE = '$future';
const PERIODS_TODAY = '$today';
const PERIODS_YESTERDAY = '$yesterday';
const PERIODS_PREVIOUS_WEEK = '$previousWeek';
const PERIODS_PREVIOUS_MONTH = '$previousMonth';
const PERIODS_PREVIOUS_QUARTER = '$previousQuarter';
const PERIODS_PREVIOUS_YEAR = '$previousYear';
const PERIODS_WEEK_TO_DATE = '$weekToDate';
const PERIODS_MONTH_TO_DATE = '$monthToDate';
const PERIODS_QUARTER_TO_DATE = '$quarterToDate';
const PERIODS_YEAR_TO_DATE = '$yearToDate';

const VALUES_DATE = [
  PERIODS_PAST,
  PERIODS_FUTURE,
  PERIODS_TODAY,
  PERIODS_YESTERDAY,
  PERIODS_PREVIOUS_WEEK,
  PERIODS_PREVIOUS_MONTH,
  PERIODS_PREVIOUS_QUARTER,
  PERIODS_PREVIOUS_YEAR,
  PERIODS_WEEK_TO_DATE,
  PERIODS_MONTH_TO_DATE,
  PERIODS_QUARTER_TO_DATE,
  PERIODS_YEAR_TO_DATE,
];

const PERIODS_PREVIOUS_X_DAYS = /^\$previous(\d+)Days$/;
const PERIODS_X_DAYS_TO_DATE = /^\$(\d+)DaysToDate$/;
const PERIODS_X_HOURS_BEFORE = /^\$(\d+)HoursBefore$/;
const PERIODS_X_HOURS_AFTER = /^\$(\d+)HoursAfter$/;

function OperatorValueParser(opts, timezone) {
  const offsetClient = parseInt(timezone, 10);
  const offsetServer = moment().utcOffset() / 60;
  const offsetHours = offsetServer - offsetClient;

  this.perform = (model, key, value) => {
    const schema = Interface.Schemas.schemas[utils.getModelName(model)];
    let parseFct = val => val;
    let ret = null;

    const fieldValues = key.split(':');
    const fieldName = fieldValues[0];
    const subfieldName = fieldValues[1];

    // Mongoose Aggregate don't parse the value automatically.
    let field = _.find(schema.fields, { field: fieldName });

    const isEmbeddedField = !!field.type.fields;
    if (isEmbeddedField) {
      field = _.find(field.type.fields, { field: subfieldName });
    }

    if (field) {
      switch (field.type) {
        case 'Number':
          parseFct = parseInt;
          break;
        case 'Date':
          parseFct = val => new Date(val);
          break;
        case 'Boolean':
          parseFct = (val) => {
            if (val === 'true') { return true; }
            if (val === 'false') { return false; }
            return null;
          };
          break;
        case 'String':
          parseFct = (val) => {
            // NOTICE: Check if the value is a real ObjectID. By default, the
            // isValid method returns true for a random string with length 12.
            // Example: 'Black Friday'.
            if (opts.mongoose.Types.ObjectId.isValid(val) &&
              opts.mongoose.Types.ObjectId(val).toString() === val) {
              return opts.mongoose.Types.ObjectId(val);
            }
            return val;
          };
          break;
        default:
          break;
      }

      if (_.isArray(field.type)) {
        parseFct = val => ({ $size: val });
      }
    }

    if (value[0] === '!' && value[1] !== '*') {
      value = value.substring(1);
      ret = { $ne: parseFct(value) };
    } else if (value[0] === '>') {
      value = value.substring(1);
      ret = { $gt: parseFct(value) };
    } else if (value[0] === '<') {
      value = value.substring(1);
      ret = { $lt: parseFct(value) };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      value = value.substring(1, value.length - 1);
      ret = new RegExp(`.*${parseFct(value)}.*`);
    } else if (value[0] === '!' && value[1] === '*' && value[value.length - 1] === '*') {
      value = value.substring(2, value.length - 1);
      ret = { $not: new RegExp(`.*${parseFct(value)}.*`) };
    } else if (value[0] === '*') {
      value = value.substring(1);
      ret = new RegExp(`.*${parseFct(value)}$`);
    } else if (value[value.length - 1] === '*') {
      value = value.substring(0, value.length - 1);
      ret = new RegExp(`^${parseFct(value)}.*`);
    } else if (value === '$present') {
      ret = { $exists: true };
    } else if (value === '$blank') {
      ret = { $exists: false };
    } else if (this.isIntervalDateValue(value)) {
      ret = this.getIntervalDateValue(value);
    } else {
      ret = parseFct(value);
    }

    return ret;
  };

  this.getIntervalDateValue = (currentValue) => {
    let from = null;
    let to = null;

    if (currentValue === PERIODS_FUTURE) {
      return { $gte: moment().toDate() };
    }

    if (currentValue === PERIODS_PAST) {
      return { $lte: moment().toDate() };
    }

    if (currentValue === PERIODS_TODAY) {
      return {
        $gte: moment().startOf('day').add(offsetHours, 'h').toDate(),
        $lte: moment().endOf('day').add(offsetHours, 'h').toDate(),
      };
    }

    let match = currentValue.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) {
      return {
        $gte: moment()
          .subtract(match[1], 'days')
          .startOf('day')
          .add(offsetHours, 'h')
          .toDate(),
        $lte: moment()
          .subtract(1, 'days')
          .endOf('day')
          .add(offsetHours, 'h')
          .toDate(),
      };
    }

    match = currentValue.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) {
      return {
        $gte: moment().subtract(match[1] - 1, 'days').startOf('day').toDate(),
        $lte: moment().toDate(),
      };
    }

    match = currentValue.match(PERIODS_X_HOURS_BEFORE);
    if (match && match[1]) {
      return { $lte: moment().subtract(match[1], 'hours').toDate() };
    }

    match = currentValue.match(PERIODS_X_HOURS_AFTER);
    if (match && match[1]) {
      return { $gte: moment().subtract(match[1], 'hours').toDate() };
    }

    switch (currentValue) {
      case PERIODS_YESTERDAY:
        from = moment()
          .subtract(1, 'days')
          .startOf('day')
          .add(offsetHours, 'h')
          .toDate();
        to = moment()
          .subtract(1, 'days')
          .endOf('day')
          .add(offsetHours, 'h')
          .toDate();
        break;
      case PERIODS_PREVIOUS_WEEK:
        from = moment()
          .subtract(1, 'weeks')
          .startOf('isoWeek')
          .add(offsetHours, 'h')
          .toDate();
        to = moment()
          .subtract(1, 'weeks')
          .endOf('isoWeek')
          .add(offsetHours, 'h')
          .toDate();
        break;
      case PERIODS_PREVIOUS_MONTH:
        from = moment()
          .subtract(1, 'months')
          .startOf('month')
          .add(offsetHours, 'h')
          .toDate();
        to = moment()
          .subtract(1, 'months')
          .endOf('month')
          .add(offsetHours, 'h')
          .toDate();
        break;
      case PERIODS_PREVIOUS_QUARTER:
        from = moment()
          .subtract(1, 'quarters')
          .startOf('quarter')
          .add(offsetHours, 'h')
          .toDate();
        to = moment()
          .subtract(1, 'quarters')
          .endOf('quarter')
          .add(offsetHours, 'h')
          .toDate();
        break;
      case PERIODS_PREVIOUS_YEAR:
        from = moment()
          .subtract(1, 'years')
          .startOf('year')
          .add(offsetHours, 'h')
          .toDate();
        to = moment()
          .subtract(1, 'years')
          .endOf('year')
          .add(offsetHours, 'h')
          .toDate();
        break;
      case PERIODS_WEEK_TO_DATE:
        from = moment()
          .startOf('week')
          .add(offsetHours, 'h')
          .toDate();
        to = moment().toDate();
        break;
      case PERIODS_MONTH_TO_DATE:
        from = moment()
          .startOf('month')
          .add(offsetHours, 'h')
          .toDate();
        to = moment().toDate();
        break;
      case PERIODS_QUARTER_TO_DATE:
        from = moment()
          .startOf('quarter')
          .add(offsetHours, 'h')
          .toDate();
        to = moment().toDate();
        break;
      case PERIODS_YEAR_TO_DATE:
        from = moment()
          .startOf('year')
          .add(offsetHours, 'h')
          .toDate();
        to = moment().toDate();
        break;
      default:
        break;
    }

    return { $gte: from, $lte: to };
  };

  this.isIntervalDateValue = (currentValue) => {
    let match = currentValue.match(PERIODS_PREVIOUS_X_DAYS);
    if (match && match[1]) { return true; }

    match = currentValue.match(PERIODS_X_DAYS_TO_DATE);
    if (match && match[1]) { return true; }

    match = currentValue.match(PERIODS_X_HOURS_BEFORE);
    if (match && match[1]) { return true; }

    match = currentValue.match(PERIODS_X_HOURS_AFTER);
    if (match && match[1]) { return true; }

    return VALUES_DATE.indexOf(currentValue) !== -1;
  };
}

module.exports = OperatorValueParser;
