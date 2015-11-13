'use strict';
var P = require('bluebird');
var SchemaUtils = require('../utils/schema');

function IncludeParamParser(record, include, opts) {

  this.perform = function () {
    return P.map(Object.keys(include), function (fieldName) {
      var reference = include[fieldName];
      var referenceField = SchemaUtils.getReferenceField(reference);

      return new P(function (resolve, reject) {
        var inverseOf = fieldName.split(':')[1];
        var query = {};
        query[inverseOf] = record[referenceField];

        var referenceModel = SchemaUtils.getReferenceModel(
          opts.mongoose, reference);

        referenceModel.find(query).lean().exec(function (err, records) {
          if (err) { reject(err); }

          record[fieldName.split(':')[0]] = records;
          resolve(record);
        });
      });
    });
  };
}

module.exports = IncludeParamParser;
