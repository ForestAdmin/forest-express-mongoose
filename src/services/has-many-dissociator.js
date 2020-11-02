const P = require('bluebird');

function HasManyDissociator(model, association, opts, params, data) {
  const isDelete = Boolean(params.delete);

  this.perform = () =>
    new P(((resolve, reject) => {
      const documentIds = data.data.map((document) => document.id);

      if (isDelete) {
        association.deleteMany({
          _id: { $in: documentIds },
        }, (error) => {
          if (error) { return reject(error); }
          return resolve();
        });
      }
      const updateParams = {};
      updateParams[params.associationName] = { $in: documentIds };

      model
        .findByIdAndUpdate(params.recordId, {
          $pull: updateParams,
        }, {
          new: true,
        })
        .lean()
        .exec((error, record) => {
          if (error) { return reject(error); }
          return resolve(record);
        });
    }));
}

module.exports = HasManyDissociator;
