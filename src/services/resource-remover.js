
class ResourceRemover {
  constructor(model, params) {
    this._model = model;
    this._params = params;
  }

  async perform() {
    await this._model.deleteOne({ _id: this._params.recordId });
  }
}

module.exports = ResourceRemover;
