const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');

class ResourceCreator {
  constructor(model, params) {
    this._model = model;
    this._params = params;
    this._schema = Interface.Schemas.schemas[utils.getModelName(model)];
  }

  async _create() {
    const idField = this._schema.fields.find((field) => field.field === '_id');
    const isAutomaticId = !idField || !idField.isRequired;

    if ('_id' in this._params && isAutomaticId) {
      delete this._params._id;
    }

    return new this._model(this._params).save();
  }

  async _fetch(record) {
    const query = this._model.findById(record.id);

    _.each(this._schema.fields, (field) => {
      if (field.reference) { query.populate(field.field); }
    });

    return query.lean().exec();
  }

  async perform() {
    const record = await this._create();
    return this._fetch(record);
  }
}

module.exports = ResourceCreator;
