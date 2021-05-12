class EmbeddedDocumentUpdater {
  constructor(model, params, association, record) {
    this._model = model;
    this._params = params;
    this._association = association;
    this._record = record;
  }

  async perform() {
    const { recordId } = this._params;
    const recordIndex = parseInt(this._params.recordIndex, 10);

    delete this._record._id;

    const update = Object.keys(this._record).reduce((acc, value) => {
      acc.$set[`${this._association}.${recordIndex}.${value}`] = this._record[value];
      return acc;
    }, { $set: {} });

    return this._model.findByIdAndUpdate(recordId, update);
  }
}

module.exports = EmbeddedDocumentUpdater;
