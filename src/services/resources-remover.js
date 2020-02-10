const { InvalidParameterError } = require('./errors');

function ResourcesRemover(model, ids) {
  this.perform = () => {
    if (!Array.isArray(ids) || !ids.length) {
      throw new InvalidParameterError('`ids` must be a non-empty array.');
    }

    return model.deleteMany({ _id: ids });
  };
}

module.exports = ResourcesRemover;
