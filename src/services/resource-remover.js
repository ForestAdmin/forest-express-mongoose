import ResourcesRemover from './resources-remover';

class ResourceRemover extends ResourcesRemover {
  constructor(model, params, user) {
    super(model, params, [params.recordId], user);
  }

  perform() {
    if (!this._params.recordId) {
      return null;
    }

    return super.perform();
  }
}

module.exports = ResourceRemover;
