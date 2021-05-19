const { InvalidParameterError } = require('./errors');

class ResourcesRemover {
  constructor(model, ids) {
    this._model = model;
    this._ids = ids;
  }

  perform() {
    if (!Array.isArray(this._ids) || !this._ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    return this._model.deleteMany({ _id: this._ids });
  }
}

module.exports = ResourcesRemover;
