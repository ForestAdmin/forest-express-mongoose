'use strict';
var P = require('bluebird');

function HasManyDissociator(model, association, opts, params, data) {
  var isDelete = Boolean(params.delete);

  this.perform = function () {
    return new P(function (resolve, reject) {

      var documentIds = data.data.map(function (document) {
        return document.id;
      });

      if (isDelete) {
        association.deleteMany({
          _id: { $in: documentIds }
        }, function (error) {
          if (error) { return reject(error); }
          resolve();
        });
      } else {
        var updateParams = {};
        updateParams[params.associationName] = { $in: documentIds };

        model
          .findByIdAndUpdate(params.recordId, {
            $pull: updateParams
          }, {
            new: true
          })
          .lean()
          .exec(function (error, record) {
            if (error) { return reject(error); }
            resolve(record);
          });
      }
    });
  };
}

module.exports = HasManyDissociator;
