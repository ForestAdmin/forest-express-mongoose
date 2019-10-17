const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');

function SearchBuilder(model, opts, params, searchFields) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const fieldsSearched = [];

  this.hasSmartFieldSearch = false;

  this.getFieldsSearched = () => fieldsSearched;

  this.getConditions = () => {
    this.hasSmartFieldSearch = false;
    const orQuery = { $or: [] };

    function pushCondition(condition, fieldName) {
      orQuery.$or.push(condition);
      fieldsSearched.push(fieldName);
    }

    _.each(model.schema.paths, (value, key) => {
      if (searchFields && searchFields.indexOf(value.path) === -1) {
        return;
      }

      const condition = {};
      const searchValue = params.search.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&');
      const searchRegexp = new RegExp(`.*${searchValue}.*`, 'i');

      if (value.instance === 'ObjectID') {
        if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
          condition[key] = opts.mongoose.Types.ObjectId(params.search);
          pushCondition(condition, key);
        }
      } else if (value.instance === 'Number') {
        const searchNumber = Number(params.search);
        if (!Number.isNaN(searchNumber)) {
          condition[key] = Number(params.search);
          pushCondition(condition, key);
        }
      } else if (value.instance === 'String') {
        condition[key] = searchRegexp;
        pushCondition(condition, key);
      } else if (value.instance === 'Array') {
        const field = _.find(schema.fields, { field: key });
        if (field && _.isArray(field.type) && field.type[0] === 'String' &&
          !field.reference) {
          condition[key] = searchRegexp;
          pushCondition(condition, key);
        } else if (field && _.isArray(field.type) &&
          !field.reference && Number.parseInt(params.searchExtended, 10)) {
          const elemMatch = { $elemMatch: { $or: [] } };

          field.type[0].fields.forEach((subField) => {
            const query = {};
            if (subField.type === 'String' &&
              !value.schema.obj[subField.field].ref) {
              query[subField.field] = searchRegexp;
              elemMatch.$elemMatch.$or.push(query);
            } else if (subField.type === 'Number' &&
              Number.parseInt(params.search, 10)) {
              query[subField.field] = Number.parseInt(params.search, 10);
              elemMatch.$elemMatch.$or.push(query);
            }
          });
          condition[key] = elemMatch;
          pushCondition(condition, key);
        }
      }
    });

    _.each(schema.fields, (field) => {
      if (field.search) {
        try {
          const condition = field.search(params.search);
          if (condition) {
            pushCondition(condition, field.field);
          }
          this.hasSmartFieldSearch = true;
        } catch (error) {
          Interface.logger.error(`Cannot search properly on Smart Field ${field.field}`, error);
        }
      }
    });

    return orQuery.$or.length ? orQuery : {};
  };

  this.getWhere = (jsonQuery) => {
    jsonQuery.push(this.getConditions());
  };
}

module.exports = SearchBuilder;
