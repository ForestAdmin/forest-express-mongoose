const _ = require('lodash');
const Interface = require('forest-express');
const createError = require('http-errors');
const utils = require('../utils/schema');
const ResourcesGetter = require('./resources-getter');

class ResourceGetter {
  constructor(model, params, user) {
    this._model = model;
    this._params = params;
    this._user = user;
  }

  _handlePopulate(query) {
    const schema = Interface.Schemas.schemas[utils.getModelName(this._model)];
    _.each(schema.fields, (field) => {
      if (field.reference) {
        query.populate(field.field);
      }
    });
  }

  async perform() {
    let record = null;

    if (await this._isAllowed()) {
      const query = this._model.findById(this._params.recordId);
      this._handlePopulate(query);
      record = await query.lean().exec();
    }

    if (!record) {
      throw createError(404, `The ${this._model.name} #${this._params.recordId} does not exist.`);
    }

    return record;
  }

  /**
   * Check if the record is in scope for the given user.
   * We can't do that in a single request to mongo, as checking scopes requires using
   * an aggregation pipeline to perform $lookups
   */
  async _isAllowed() {
    const params = {
      timezone: this._params.timezone,
      filters: JSON.stringify({ field: '_id', operator: 'equal', value: this._params.recordId }),
    };

    return await new ResourcesGetter(this._model, null, params, this._user).count() === 1;
  }
}

module.exports = ResourceGetter;
