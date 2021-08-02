import Flattener from './flattener';

class HasManyDissociator {
  constructor(model, association, opts, params, data) {
    this._model = model;
    this._association = association;
    this._params = params;
    this._data = data;
  }

  async perform() {
    const isDelete = Boolean(this._params.delete);
    const documentIds = this._data.data.map((document) => document.id);
    if (isDelete) {
      await this._association.deleteMany({ _id: { $in: documentIds } });
    }

    const updateParams = {};
    updateParams[Flattener.unflattenFieldName(this._params.associationName)] = { $in: documentIds };

    return this._model
      .findByIdAndUpdate(this._params.recordId, {
        $pull: updateParams,
      }, {
        new: true,
      })
      .lean()
      .exec();
  }
}

module.exports = HasManyDissociator;
