const utils = require('../utils/schema');
const Analyser = require('../utils/field-analyser');

/* eslint-disable */
function unflatten(data) {
  const result = {};
  for (var key in data) {
    var keys = key.split('.');
    keys.reduce((result, subKey, index) => {
      if (!result[subKey]) {
        if (Number.isNaN(Number(keys[index + 1]))) {
          result[subKey] = keys.length - 1 === index ? data[key] : {};
        } else {
          result[subKey] = [];
        }
      }
      return result[subKey];
    }, result);
  }
  return result;
}
/* eslint-enable */

module.exports = async (model, opts) => {
  const fields = [];
  const paths = unflatten(model.schema.paths);
  const analyser = new Analyser(model, opts);

  Object.keys(paths).forEach(async (path) => {
    if (path === '__v') { return; }
    const field = analyser.getFieldSchema(path, paths[path]);
    fields.push(field);
  });

  return {
    name: utils.getModelName(model),
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: model.collection.name.replace(' ', ''),
    idField: '_id',
    primaryKeys: ['_id'],
    isCompositePrimary: false,
    fields,
  };
};
