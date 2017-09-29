'use strict';
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function SearchBuilder(model, opts, params, searchFields) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  this.getConditions = function () {
    if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
      return { _id: params.search };
    } else {
      var orQuery = { $or: [] };

      _.each(model.schema.paths, function (value, key) {
        if (searchFields && searchFields.indexOf(value.path) === -1) {
          return null;
        }
        var q = {};

        if (value.instance === 'ObjectID') {
          try {
            q[key] = opts.mongoose.Types.ObjectId(params.search);
            orQuery.$or.push(q);
          } catch(error) { return null; }
        } else if (value.instance === 'String') {
          q[key] = new RegExp('.*' + params.search + '.*', 'i');
          orQuery.$or.push(q);
        } else if (value.instance === 'Array') {
          var field = _.findWhere(schema.fields, { field: key });
          if (field && _.isArray(field.type) && field.type[0] === 'String' &&
            !field.reference) {
            q[key] = new RegExp('.*' + params.search + '.*', 'i');
            orQuery.$or.push(q);
          } else if (field && _.isArray(field.type) &&
            !field.reference && parseInt(params.searchExtended)) {
            var elemMatch = { $elemMatch: { $or: [], } };

            field.type[0].fields.forEach(function(subField) {
              var query = {};
              if (subField.type === 'String' &&
                !value.schema.obj[subField.field].ref) {
                query[subField.field] = new RegExp('.*' + params.search + '.*',
                  'i');
                elemMatch.$elemMatch.$or.push(query);
              } else if (subField.type === 'Number' &&
                parseInt(params.search)) {
                query[subField.field] = parseInt(params.search);
                elemMatch.$elemMatch.$or.push(query);
              }
            });
            q[key] = elemMatch;
            orQuery.$or.push(q);
          }
        }
      });

      return orQuery.$or.length ? orQuery : { _id: null };
    }
  };

  this.getWhere = function (query) {
    query.where(this.getConditions());
  };
}

module.exports = SearchBuilder;
