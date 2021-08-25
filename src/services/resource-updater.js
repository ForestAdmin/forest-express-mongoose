const _ = require('lodash');
const Interface = require('forest-express');
const createError = require('http-errors');
const ResourcesGetter = require('./resources-getter');
const utils = require('../utils/schema');
const Flattener = require('./flattener');

class ResourceUpdater {
  constructor(model, params, record, user) {
    this._model = model;
    this._params = params;
    this._record = record;
    this._user = user;
  }

  async perform() {
    const modelName = utils.getModelName(this._model);
    const schema = Interface.Schemas.schemas[utils.getModelName(this._model)];

    const recordId = this._record._id;
    if (!await this._isAllowed(recordId)) {
      throw createError(404, `The ${this._model.name} #${recordId} does not exist.`);
    }

    // NOTICE: Old versions of MongoDB (2.X) seem to refuse the presence of
    //         the _id in the $set. So we remove it. It is useless anyway.
    delete this._record._id;

    const flattenedFields = Flattener.getFlattenedFieldsName(schema.fields);

    const query = this._model.findByIdAndUpdate(
      recordId,
      { $set: Flattener.flattenRecordDataForUpdates(this._record, null, flattenedFields) },
      { new: true, runValidators: true },
    );

    _.each(schema.fields, (field) => {
      if (field.reference) { query.populate(field.field); }
    });

    try {
      return query.lean().exec();
    } catch (error) {
      if (error.message.indexOf('Cast to') > -1 && error.message.indexOf('failed for value') > -1) {
        Interface.logger.warn(`Cannot update the ${modelName} #${recordId} because of a "type" key usage (which is a reserved keyword in Mongoose).`);
      } else {
        Interface.logger.error(`Cannot update the ${modelName} #${recordId} because of an unexpected issue: ${error}`);
      }

      throw error;
    }
  }

  /**
   * Check if the record is in scope for the given user.
   * We can't do that in a single request to mongo, as checking scopes requires using
   * an aggregation pipeline to perform $lookups
   */
  async _isAllowed(recordId) {
    const params = {
      timezone: this._params.timezone,
      filters: JSON.stringify({ field: '_id', operator: 'equal', value: recordId }),
    };

    return await new ResourcesGetter(this._model, null, params, this._user).count() === 1;
  }
}

module.exports = ResourceUpdater;
