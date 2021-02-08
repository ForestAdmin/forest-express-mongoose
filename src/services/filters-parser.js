import _ from 'lodash';
import Interface, { BaseFiltersParser, BaseOperatorDateParser } from 'forest-express';
import { NoMatchingOperatorError, InvalidFiltersFormatError } from './errors';
import utils from '../utils/schema';

const AGGREGATOR_OPERATORS = ['and', 'or'];

function FiltersParser(model, timezone, options) {
  const modelSchema = Interface.Schemas.schemas[utils.getModelName(model)];

  const parseInteger = (value) => Number.parseInt(value, 10);
  const parseDate = (value) => new Date(value);
  const parseBoolean = (value) => {
    if (value === 'true') { return true; }
    if (value === 'false') { return false; }
    return typeof value === 'boolean' ? value : null;
  };
  const parseString = (value) => {
    // NOTICE: Check if the value is a real ObjectID. By default, the isValid method returns true
    //         for a random string with length 12 (example: 'Black Friday').
    const { ObjectId } = options.Mongoose.Types;
    if (ObjectId.isValid(value) && ObjectId(value).toString() === value) {
      return ObjectId(value);
    }
    return value;
  };
  const parseArray = (value) => ({ $size: value });
  const parseOther = (value) => value;

  this.operatorDateParser = new BaseOperatorDateParser({
    operators: { GTE: '$gte', LTE: '$lte' },
    timezone,
  });

  this.perform = async (filtersString) => BaseFiltersParser
    .perform(filtersString, this.formatAggregation, this.formatCondition);

  this.formatAggregation = async (aggregator, formatedConditions) => {
    const aggregatorOperator = this.formatAggregatorOperator(aggregator);
    return { [aggregatorOperator]: formatedConditions };
  };

  this._ensureIsValidCondition = (condition) => {
    if (_.isEmpty(condition)) {
      throw new InvalidFiltersFormatError('Empty condition in filter');
    }
    if (!_.isObject(condition)) {
      throw new InvalidFiltersFormatError('Condition cannot be a raw value');
    }
    if (_.isArray(condition)) {
      throw new InvalidFiltersFormatError('Filters cannot be a raw array');
    }
    if (!_.isString(condition.field)
        || !_.isString(condition.operator)
        || _.isUndefined(condition.value)) {
      throw new InvalidFiltersFormatError('Invalid condition format');
    }
  };

  this.getSmartFieldCondition = async (condition) => {
    const fieldFound = modelSchema.fields.find((field) => field.field === condition.field);

    if (!fieldFound.filter) {
      throw new Error(`"filter" method missing on smart field "${fieldFound.field}"`);
    }

    const formattedCondition = await Promise.resolve(fieldFound
      .filter({
        where: await this.formatOperatorValue(
          condition.field,
          condition.operator,
          condition.value,
        ),
        condition,
      }));
    if (!formattedCondition) {
      throw new Error(`"filter" method on smart field "${fieldFound.field}" must return a condition`);
    }
    return formattedCondition;
  };

  this.formatCondition = async (condition) => {
    this._ensureIsValidCondition(condition);

    if (this.isSmartField(modelSchema, condition.field)) {
      return this.getSmartFieldCondition(condition);
    }

    const formatedField = this.formatField(condition.field);

    return {
      [formatedField]: await this.formatOperatorValue(
        condition.field,
        condition.operator,
        condition.value,
      ),
    };
  };

  this.getParserForType = (type) => {
    switch (type) {
      case 'Number': return parseInteger;
      case 'Date': return parseDate;
      case 'Boolean': return parseBoolean;
      case 'String': return parseString;
      case _.isArray(type): return parseArray;
      default: return parseOther;
    }
  };

  this.getParserForField = async (key) => {
    const [fieldName, subfieldName] = key.split(':');

    // NOTICE: Mongoose Aggregate don't parse the value automatically.
    let field = _.find(modelSchema.fields, { field: fieldName });

    if (!field) {
      throw new InvalidFiltersFormatError(`Field '${fieldName}' not found on collection '${modelSchema.name}'`);
    }

    const isEmbeddedField = !!field.type.fields;
    if (isEmbeddedField) {
      field = _.find(field.type.fields, { field: subfieldName });
    }

    if (!field) return (val) => val;

    const parse = this.getParserForType(field.type);

    return (value) => {
      if (value && _.isArray(value)) {
        return value.map(parse);
      }
      return parse(value);
    };
  };

  this.formatAggregatorOperator = (aggregatorOperator) => {
    if (AGGREGATOR_OPERATORS.includes(aggregatorOperator)) return `$${aggregatorOperator}`;
    throw new NoMatchingOperatorError();
  };

  this.formatOperatorValue = async (field, operator, value) => {
    if (this.operatorDateParser.isDateOperator(operator)) {
      return this.operatorDateParser.getDateFilter(operator, value);
    }

    const parseFct = await this.getParserForField(field);

    switch (operator) {
      case 'not':
      case 'not_equal':
        return { $ne: parseFct(value) };
      case 'greater_than':
      case 'after':
        return { $gt: parseFct(value) };
      case 'less_than':
      case 'before':
        return { $lt: parseFct(value) };
      case 'contains':
        return new RegExp(`.*${parseFct(value)}.*`);
      case 'starts_with':
        return new RegExp(`^${parseFct(value)}.*`);
      case 'ends_with':
        return new RegExp(`.*${parseFct(value)}$`);
      case 'not_contains':
        return { $not: new RegExp(`.*${parseFct(value)}.*`) };
      case 'present':
        return { $exists: true, $ne: null };
      case 'blank':
        return { $in: [null, ''] };
      case 'equal':
        return parseFct(value);
      case 'in':
        return { $in: parseFct(value) };
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.formatField = (field) => field.replace(':', '.');

  this.isSmartField = (schema, fieldName) => {
    const fieldFound = schema.fields.find((field) => field.field === fieldName);
    return !!fieldFound && !!fieldFound.isVirtual;
  };

  this.getAssociations = async (filtersString) => BaseFiltersParser.getAssociations(filtersString);

  this.formatAggregationForReferences = (aggregator, conditions) => ({ aggregator, conditions });

  this.formatConditionForReferences = async (condition) => {
    if (_.isEmpty(condition)) {
      throw new InvalidFiltersFormatError('Empty condition in filter');
    }
    if (!_.isObject(condition)) {
      throw new InvalidFiltersFormatError('Condition cannot be a raw value');
    }
    if (_.isArray(condition)) {
      throw new InvalidFiltersFormatError('Filters cannot be a raw array');
    }
    if (!_.isString(condition.field)
        || !_.isString(condition.operator)
        || _.isUndefined(condition.value)) {
      throw new InvalidFiltersFormatError('Invalid condition format');
    }

    const [fieldName, subFieldName] = this.formatField(condition.field).split('.');
    if (!subFieldName) {
      return condition;
    }

    // Mongoose Aggregate don't parse the value automatically.
    const field = _.find(modelSchema.fields, { field: fieldName });

    if (!field) {
      throw new InvalidFiltersFormatError(`Field '${fieldName}' not found on collection '${modelSchema.name}'`);
    }

    if (!field.reference) {
      return condition;
    }

    const subModel = utils.getReferenceModel(options, field.reference);
    const subModelFilterParser = new FiltersParser(subModel, timezone, options);
    const newCondition = {
      operator: condition.operator,
      value: condition.value,
      field: subFieldName,
    };
    const query = await subModelFilterParser.perform(JSON.stringify(newCondition));
    const [, referencedKey] = field.reference.split('.');
    const subModelIds = await subModel.find(query)
      .then((records) => records.map((record) => record[referencedKey]));

    const resultCondition = {
      field: fieldName,
      operator: 'in',
      value: subModelIds,
    };
    if (condition.operator === 'blank') {
      return {
        aggregator: 'or',
        conditions: [{
          field: fieldName,
          operator: 'blank',
          value: null,
        }, resultCondition],
      };
    }

    return resultCondition;
  };

  this.replaceAllReferences = async (filtersString) => BaseFiltersParser
    .perform(filtersString, this.formatAggregationForReferences, this.formatConditionForReferences);
}

module.exports = FiltersParser;
