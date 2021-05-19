const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');

function ResourceCreator(Model, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(Model)];

  async function create() {
    const idField = schema.fields.find((field) => field.field === '_id');
    const isAutomaticId = !idField || !idField.isRequired;

    if ('_id' in params && isAutomaticId) {
      delete params._id;
    }

    return new Model(params).save();
  }

  async function fetch(record) {
    const query = Model.findById(record.id);

    _.each(schema.fields, (field) => {
      if (field.reference) { query.populate(field.field); }
    });

    return query.lean().exec();
  }

  this.perform = async () => {
    const record = await create();
    return fetch(record);
  };
}

module.exports = ResourceCreator;
