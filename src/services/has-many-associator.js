const P = require('bluebird');

function HasManyAssociator(model, association, opts, params, data) {
  this.perform = () =>
    new P(((resolve, reject) => {
      const updateParams = {};
      updateParams[params.associationName] = {
        $each: data.data.map((document) => document.id),
      };

      model
        .findByIdAndUpdate(params.recordId, {
          $push: updateParams,
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

module.exports = HasManyAssociator;
