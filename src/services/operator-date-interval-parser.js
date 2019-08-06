import moment from 'moment';
import { NoMatchingOperatorError } from './errors';

const PERIODS = {
  yesterday: 'days',
  previous_week: 'weeks',
  previous_week_to_date: 'weeks',
  previous_month: 'months',
  previous_month_to_date: 'months',
  previous_quarter: 'quarters',
  previous_quarter_to_date: 'quarters',
  previous_year: 'years',
  previous_year_to_date: 'years',
};

const PERIODS_VALUES = {
  days: 'day',
  weeks: 'isoWeek',
  months: 'month',
  quarters: 'quarter',
  years: 'year',
};

const DATE_OPERATORS = [
  'today',
  'yesterday',
  'previous_week',
  'previous_month',
  'previous_quarter',
  'previous_year',
  'previous_week_to_date',
  'previous_month_to_date',
  'previous_quarter_to_date',
  'previous_year_to_date',
  'previous_x_days',
  'previous_x_days_to_date',
  'past',
  'future',
  'before_x_hours_ago',
  'after_x_hours_ago',
];

function OperatorDateIntervalParser(timezone) {
  const offsetClient = parseInt(timezone, 10);
  const offsetServer = moment().utcOffset() / 60;

  this.offsetHours = offsetServer - offsetClient;

  this.toDateWithTimezone = customMoment => customMoment.add(this.offsetHours, 'h').toDate();

  this.isDateIntervalOperator = operator => DATE_OPERATORS.includes(operator);

  this.getDateIntervalFilter = (operator, value) => {
    switch (operator) {
      case 'today':
        return {
          $gte: moment().startOf('day').add(this.offsetHours, 'h').toDate(),
          $lte: moment().endOf('day').add(this.offsetHours, 'h').toDate(),
        };
      case 'past':
        return { $lte: moment().toDate() };
      case 'future':
        return { $gte: moment().toDate() };
      case 'yesterday':
      case 'previous_week':
      case 'previous_month':
      case 'previous_quarter':
      case 'previous_year':
        return {
          $gte: this.toDateWithTimezone(moment().subtract(1, PERIODS[operator])
            .startOf(PERIODS_VALUES[PERIODS[operator]])),
          $lte: this.toDateWithTimezone(moment().subtract(1, PERIODS[operator])
            .endOf(PERIODS_VALUES[PERIODS[operator]])),
        };
      case 'previous_week_to_date':
      case 'previous_month_to_date':
      case 'previous_quarter_to_date':
      case 'previous_year_to_date':
        return {
          $gte: this.toDateWithTimezone(moment().startOf(PERIODS_VALUES[PERIODS[operator]])),
          $lte: moment().toDate(),
        };
      case 'previous_x_days':
        return {
          $gte: this.toDateWithTimezone(moment().subtract(value, 'days').startOf('day')),
          $lte: this.toDateWithTimezone(moment().subtract(1, 'days').endOf('day')),
        };
      case 'previous_x_days_to_date':
        return {
          $gte: this.toDateWithTimezone(moment().subtract(value - 1, 'days').startOf('day')),
          $lte: moment().toDate(),
        };
      case 'before_x_hours_ago':
        return { $lte: moment().subtract(value, 'hours').toDate() };
      case 'after_x_hours_ago':
        return { $gte: moment().subtract(value, 'hours').toDate() };
      default:
        throw new NoMatchingOperatorError();
    }
  };
}

module.exports = OperatorDateIntervalParser;
