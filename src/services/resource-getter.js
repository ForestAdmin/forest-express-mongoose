const P = require('bluebird');
const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');
const createError = require('http-errors');

function ResourceGetter(model, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];

  function handlePopulate(query) {
    _.each(schema.fields, (field) => {
      if (field.reference) {
        query.populate(field.field);
      }
    });
  }

  this.perform = () =>
    new P((resolve, reject) => {
      const query = model.findById(params.recordId);

      handlePopulate(query);

      query
        .lean()
        .exec((error, record) => {
          if (!record) {
            return reject(createError(404, `The ${model.name} #${params.recordId} does not exist.`));
          }
          if (error) { return reject(error); }
          return resolve(record);
        });
    });
}

module.exports = ResourceGetter;
