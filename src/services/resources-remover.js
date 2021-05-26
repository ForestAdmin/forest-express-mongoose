const { InvalidParameterError } = require('./errors');
const ResourcesGetter = require('./resources-getter');

class ResourcesRemover {
  constructor(model, params, ids, user) {
    this._model = model;
    this._params = params;
    this._ids = ids;
    this._user = user;
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

  /**
   * Check if all records maching the provided list of ids are in scope.
   * We can't do that in a single request as mongo does not supports deletes in
   * aggregation pipelines
   */
  async _isAllowed() {
    const params = {
      timezone: this._params.timezone,
      filters: JSON.stringify({ field: '_id', operator: 'in', value: this._ids }),
    };

    return this._ids.length
      === await new ResourcesGetter(this._model, null, params, this._user).count();
  }
}

module.exports = ResourcesRemover;
