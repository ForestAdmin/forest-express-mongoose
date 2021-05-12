const _ = require('lodash');
const Interface = require('forest-express');
const utils = require('../utils/schema');

class ResourceUpdater {
  constructor(model, params, record) {
    this._model = model;
    this._record = record;
  }

  async perform() {
    const modelName = utils.getModelName(this._model);
    const schema = Interface.Schemas.schemas[utils.getModelName(this._model)];

    const recordId = this._record._id;

    // NOTICE: Old versions of MongoDB (2.X) seem to refuse the presence of
    //         the _id in the $set. So we remove it. It is useless anyway.
    delete this._record._id;

    const query = this._model.findByIdAndUpdate(
      recordId,
      { $set: this._record },
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
}

module.exports = ResourceUpdater;
