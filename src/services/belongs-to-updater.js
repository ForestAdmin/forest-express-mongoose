import Flattener from './flattener';

class BelongsToUpdater {
  constructor(model, association, opts, params, data) {
    this._model = model;
    this._params = params;
    this._data = data;
  }

  async perform() {
    const updateParams = {};
    updateParams[
      Flattener.unflattenFieldName(this._params.associationName)
    ] = this._data.data ? this._data.data.id : null;

    return this._model
      .findByIdAndUpdate(this._params.recordId, {
        $set: updateParams,
      }, {
        new: true,
      })
      .lean()
      .exec();
  }
}

module.exports = BelongsToUpdater;
