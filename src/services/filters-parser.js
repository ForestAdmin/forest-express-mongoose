import _ from 'lodash';
import Interface, { BaseFiltersParser, BaseOperatorDateParser, SchemaUtils } from 'forest-express';
import { NoMatchingOperatorError, InvalidFiltersFormatError } from './errors';
import utils from '../utils/schema';
import Flattener from './flattener';

const AGGREGATOR_OPERATORS = ['and', 'or'];

function FiltersParser(model, timezone, options) {
  const modelSchema = Interface.Schemas.schemas[utils.getModelName(model)];

  const parseInteger = (value) => Number.parseInt(value, 10);
  const parseDate = (value) => new Date(value);
  const parseBoolean = (value) => {
    if (['true', 'yes', '1'].includes(value)) { return true; }
    if (['false', 'no', '0'].includes(value)) { return false; }

    return typeof value === 'boolean' ? value : null;
  };
  const parseObjectId = (value) => {
    // This fix issue where using aggregation pipeline, mongoose does not
    // automatically cast 'looking like' string value to ObjectId
    // CF Github Issue https://github.com/Automattic/mongoose/issues/1399
    const { ObjectId } = options.Mongoose.Types;
    if (ObjectId.isValid(value) && new ObjectId(value).toString() === value) {
      return new ObjectId(value);
    }

    return value;
  };
  const parseOther = (value) => value;

  this.operatorDateParser = new BaseOperatorDateParser({
    operators: { GTE: '$gte', LTE: '$lte' },
    timezone,
  });

  this.perform = async (filtersString) => BaseFiltersParser
    .perform(filtersString, this.formatAggregation, this.formatCondition, modelSchema);

  this.formatAggregation = async (aggregator, formatedConditions) => {
    const aggregatorOperator = this.formatAggregatorOperator(aggregator);
    return { [aggregatorOperator]: formatedConditions };
  };

  this.formatCondition = async (condition, isSmartField = false) => {
    if (isSmartField) {
      return this.formatOperatorValue(
        condition.field,
        condition.operator,
        condition.value,
      );
    }

    const formatedField = this.formatField(condition.field);

    return {
      [Flattener.unflattenFieldName(formatedField)]: await this.formatOperatorValue(
        condition.field,
        condition.operator,
        condition.value,
      ),
    };
  };

  this.getParserForType = (type) => {
    const mongooseTypes = options.Mongoose.Schema.Types;

    switch (type) {
      case 'Number':
      case Number:
      case mongooseTypes.Number:
        return parseInteger;
      case 'Date':
      case Date:
      case mongooseTypes.Date:
        return parseDate;
      case 'Boolean':
      case Boolean:
      case mongooseTypes.Boolean:
        return parseBoolean;
      case 'ObjectId':
      case mongooseTypes.ObjectId:
        return parseObjectId;
      default: return parseOther;
    }
  };

  this.getParserForField = async (key) => {
    const [fieldName, subfieldName] = key.split(':');

    const field = SchemaUtils.getField(modelSchema, fieldName);

    if (!field) {
      throw new InvalidFiltersFormatError(`Field '${fieldName}' not found on collection '${modelSchema.name}'`);
    }

    const fieldPath = subfieldName ? `${fieldName}.${subfieldName}` : fieldName;
    const fieldType = utils.getNestedFieldType(model.schema, fieldPath);

    if (!fieldType) return (val) => val;

    const parse = this.getParserForType(fieldType);

    return (value) => {
      if (value && Array.isArray(value)) {
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
        return (Array.isArray(value))
          ? { $in: parseFct(value) }
          : { $in: value.split(',').map((elem) => elem.trim()) };
      default:
        throw new NoMatchingOperatorError();
    }
  };

  this.formatField = (field) => field.replace(':', '.');

  this.getAssociations = async (filtersString) => BaseFiltersParser.getAssociations(filtersString);

  this.formatAggregationForReferences = (aggregator, conditions) => ({ aggregator, conditions });

  this.formatConditionForReferences = async (condition) => {
    if (_.isEmpty(condition)) {
      throw new InvalidFiltersFormatError('Empty condition in filter');
    }
    if (!_.isObject(condition)) {
      throw new InvalidFiltersFormatError('Condition cannot be a raw value');
    }
    if (Array.isArray(condition)) {
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
    const field = SchemaUtils.getField(modelSchema, fieldName);

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
      field: Flattener.unflattenFieldName(subFieldName),
    };
    const query = await subModelFilterParser.perform(JSON.stringify(newCondition));
    const [, referencedKey] = field.reference.split('.');
    const subModelRecords = await subModel.find(query);
    const subModelIds = subModelRecords.map((record) => record[referencedKey]);

    const resultCondition = {
      field: fieldName,
      operator: 'in',
      value: subModelIds,
    };
    if (condition.operator === 'blank') {
      return {
        aggregator: 'or',
        conditions: [{
          field: Flattener.unflattenFieldName(fieldName),
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
