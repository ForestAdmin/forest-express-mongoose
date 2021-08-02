import { Schemas } from 'forest-express';
import utils from '../utils/schema';
import ResourceGetter from './resource-getter';
import Flattener from './flattener';

class ResourceCreator {
  constructor(model, params, body, user) {
    this._model = model;
    this._params = params;
    this._body = body;
    this._user = user;
    this._schema = Schemas.schemas[utils.getModelName(model)];
    Object.keys(this._body).forEach((fieldName) => {
      if (Flattener._isFieldFlattened(fieldName)) {
        this._body[Flattener.unflattenFieldName(fieldName)] = this._body[fieldName];
        delete this._body[fieldName];
      }
    });
  }

  async _create() {
    const idField = this._schema.fields.find((field) => field.field === '_id');
    const isAutomaticId = !idField || !idField.isRequired;

    if ('_id' in this._body && isAutomaticId) {
      delete this._body._id;
    }

    return new this._model(this._body).save();
  }

  async perform() {
    const record = await this._create();
    const params = { ...this._params, recordId: record._id.toString() };
    return new ResourceGetter(this._model, params, this._user).perform();
  }
}

module.exports = ResourceCreator;
