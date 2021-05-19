const _ = require('lodash');
const Interface = require('forest-express');
const createError = require('http-errors');
const utils = require('../utils/schema');

class ResourceGetter {
  constructor(model, params) {
    this._model = model;
    this._params = params;
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
    const query = this._model.findById(this._params.recordId);
    this._handlePopulate(query);

    const record = await query.lean().exec();
    if (!record) {
      throw createError(404, `The ${this._model.name} #${this._params.recordId} does not exist.`);
    }
    return record;
  }
}

module.exports = ResourceGetter;
