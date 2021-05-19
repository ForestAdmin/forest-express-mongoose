const _ = require('lodash');
const Interface = require('forest-express');
const createError = require('http-errors');
const utils = require('../utils/schema');

function ResourceGetter(model, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];

  function handlePopulate(query) {
    _.each(schema.fields, (field) => {
      if (field.reference) {
        query.populate(field.field);
      }
    });
  }

  this.perform = async () => {
    const query = model.findById(params.recordId);
    handlePopulate(query);

    const record = await query.lean().exec();
    if (!record) {
      throw createError(404, `The ${model.name} #${params.recordId} does not exist.`);
    }
    return record;
  };
}

module.exports = ResourceGetter;
