'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Schemas = require('../generators/schemas');

function ResourceCreator(Model, params) {
  var schema = Schemas.schemas[Model.collection.name];

  function create() {
    return new P(function (resolve, reject) {
      if ('_id' in params) { delete params._id; }

      new Model(params)
        .save(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  }

  function fetch(record) {
    return new P(function (resolve, reject) {
      var query = Model.findById(record.id);

      _.each(schema.fields, function (field) {
        if (field.reference) { query.populate(field.field); }
      });

      query
        .lean()
        .exec(function (err, record) {
          if (err) { return reject(err); }
          resolve(record);
        });
    });
  }

  this.perform = function () {
    console.log('ICIII');
    console.log(require('util').inspect(params, { depth: null }));
    return create()
      .then(function (record) {
        return fetch(record);
      });
  };
}

module.exports = ResourceCreator;
