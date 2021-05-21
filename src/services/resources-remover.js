const { InvalidParameterError } = require('./errors');
const ResourcesGetter = require('./resources-getter');

class ResourcesRemover {
  constructor(model, params, ids, user) {
    this._model = model;
    this._params = params;
    this._ids = ids;
    this._user = user;
  }

  async _isAllowed() {
    const params = {
      timezone: this._params.timezone,
      filters: JSON.stringify({ field: '_id', operator: 'in', value: this._ids }),
    };

    return this._ids.length
      === await new ResourcesGetter(this._model, null, params, this._user).count();
  }

  async perform() {
    if (!Array.isArray(this._ids) || !this._ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    if (await this._isAllowed()) {
      return this._model.deleteMany({ _id: this._ids });
    }

    return null;
  }
}

module.exports = ResourcesRemover;
