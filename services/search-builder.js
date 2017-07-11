'use strict';
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function SearchBuilder(model, opts, params) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  this.getConditions = function () {
    if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
      return { _id: params.search };
    } else {
      var orQuery = { $or: [] };

      _.each(model.schema.paths, function (value, key) {
        var q = {};

        if (value.instance === 'String') {
          q[key] = new RegExp('.*' + params.search + '.*', 'i');
          orQuery.$or.push(q);
        } else if (value.instance === 'Array') {
          var field = _.findWhere(schema.fields, { field: key });
          if (field && _.isArray(field.type) && field.type[0] === 'String' &&
            !field.reference) {
            q[key] = new RegExp('.*' + params.search + '.*', 'i');
            orQuery.$or.push(q);
          }
        }
      });

      return orQuery;
    }
  };

  this.getWhere = function (query) {
    query.where(this.getConditions());
  };
}

module.exports = SearchBuilder;
