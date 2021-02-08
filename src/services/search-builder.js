const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');

function SearchBuilder(model, opts, params, searchFields) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  const fieldsSearched = [];

  this.hasSmartFieldSearch = false;

  this.getFieldsSearched = () => fieldsSearched;

  this.getConditions = async () => {
    this.hasSmartFieldSearch = false;
    const orQuery = { $or: [] };

    function pushCondition(condition, fieldName) {
      orQuery.$or.push(condition);
      fieldsSearched.push(fieldName);
    }

    _.each(model.schema.paths, (value, key) => {
      if (searchFields && !searchFields.includes(value.path)) {
        return;
      }

      const condition = {};
      const searchValue = params.search.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&');
      const searchRegexp = new RegExp(`.*${searchValue}.*`, 'i');

      if (value.instance === 'ObjectID') {
        if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
          condition[key] = opts.Mongoose.Types.ObjectId(params.search);
          pushCondition(condition, key);
        }
      } else if (value.instance === 'Number') {
        const searchNumber = Number(params.search);
        if (!Number.isNaN(searchNumber)) {
          condition[key] = searchNumber;
          pushCondition(condition, key);
        }
      } else if (value.instance === 'String') {
        condition[key] = searchRegexp;
        pushCondition(condition, key);
      } else if (value.instance === 'Array') {
        const field = _.find(schema.fields, { field: key });
        if (field && _.isArray(field.type) && field.type[0] === 'String'
          && !field.reference) {
          condition[key] = searchRegexp;
          pushCondition(condition, key);
        } else if (field && _.isArray(field.type)
          && !field.reference && Number.parseInt(params.searchExtended, 10)) {
          const elemMatch = { $elemMatch: { $or: [] } };

          field.type[0].fields.forEach((subField) => {
            const query = {};
            if (subField.type === 'String'
              && !value.schema.obj[subField.field].ref) {
              query[subField.field] = searchRegexp;
              elemMatch.$elemMatch.$or.push(query);
            } else if (subField.type === 'Number'
              && Number.parseInt(params.search, 10)) {
              query[subField.field] = Number.parseInt(params.search, 10);
              elemMatch.$elemMatch.$or.push(query);
            }
          });
          condition[key] = elemMatch;
          pushCondition(condition, key);
        }
      }
    });

    const promises = [];
    _.each(schema.fields, (field) => {
      if (field.search) {
        // eslint-disable-next-line no-async-promise-executor
        const promise = new Promise(async (resolve) => {
          try {
            const condition = await Promise.resolve(field.search(params.search));
            if (condition) {
              pushCondition(condition, field.field);
            }
            this.hasSmartFieldSearch = true;
          } catch (error) {
            Interface.logger.error(`Cannot search properly on Smart Field ${field.field}`, error);
          }

          resolve();
        });
        promises.push(promise);
      }
    });

    await Promise.all(promises);

    return orQuery.$or.length ? orQuery : {};
  };

  this.getWhere = async (jsonQuery) => {
    jsonQuery.push(await this.getConditions());
  };
}

module.exports = SearchBuilder;
