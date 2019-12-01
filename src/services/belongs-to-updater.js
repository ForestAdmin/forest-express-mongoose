const P = require('bluebird');

function BelongsToUpdater(model, association, opts, params, data) {
  this.perform = () =>
    new P(((resolve, reject) => {
      const updateParams = {};
      updateParams[params.associationName] = data.data ? data.data.id : null;

      model
        .findByIdAndUpdate(params.recordId, {
          $set: updateParams,
        }, {
          new: true,
        })
        .lean()
        .exec((err, record) => {
          if (err) { return reject(err); }
          return resolve(record);
        });
    }));
}

module.exports = BelongsToUpdater;
