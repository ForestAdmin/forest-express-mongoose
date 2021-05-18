const P = require('bluebird');

function ResourceRemover(Model, params) {
  this.perform = () =>
    new P((resolve, reject) => {
      Model.deleteOne({ _id: params.recordId }, (err) => {
        if (err) { return reject(err); }
        return resolve();
      });
    });
}

module.exports = ResourceRemover;
