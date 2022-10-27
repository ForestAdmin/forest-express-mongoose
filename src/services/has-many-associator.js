import Flattener from './flattener';

class HasManyAssociator {
  constructor(model, association, opts, params, data) {
    this._model = model;
    this._params = params;
    this._data = data;
  }

  perform() {
    const updateParams = {};
    updateParams[Flattener.unflattenFieldName(this._params.associationName)] = {
      $each: this._data.data.map((document) => document.id),
    };

    return this._model
      .findByIdAndUpdate(this._params.recordId, {
        $push: updateParams,
      }, {
        new: true,
      })
      .lean()
      .exec();
  }
}

module.exports = HasManyAssociator;
