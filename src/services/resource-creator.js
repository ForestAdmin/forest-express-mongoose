'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function ResourceCreator(Model, params) {
  var schema = Interface.Schemas.schemas[utils.getModelName(Model)];

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
    return create()
      .then(function (record) {
        return fetch(record);
      });
  };
}

module.exports = ResourceCreator;
