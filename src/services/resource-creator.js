const P = require('bluebird');
const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');

function ResourceCreator(Model, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(Model)];

  function create() {
    return new P((resolve, reject) => {
      const idField = schema.fields.find((field) => field.field === '_id');
      const isAutomaticId = !idField || idField.isGenerated;

      if ('_id' in params && isAutomaticId) {
        delete params._id;
      }

      new Model(params)
        .save((err, record) => {
          if (err) { return reject(err); }
          return resolve(record);
        });
    });
  }

  function fetch(record) {
    return new P((resolve, reject) => {
      const query = Model.findById(record.id);

      _.each(schema.fields, (field) => {
        if (field.reference) { query.populate(field.field); }
      });

      query
        .lean()
        .exec((err, recordCreated) => {
          if (err) { return reject(err); }
          return resolve(recordCreated);
        });
    });
  }

  this.perform = () =>
    create()
      .then((record) => fetch(record));
}

module.exports = ResourceCreator;
