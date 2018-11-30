'use strict';
var _ = require('lodash');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function SearchBuilder(model, opts, params, searchFields) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];
  var fieldsSearched = [];

  this.getFieldsSearched = function () {
    return fieldsSearched;
  };

  this.getConditions = function () {

    var orQuery = { $or: [] };

    function pushCondition(condition, fieldName) {
      orQuery.$or.push(condition);
      fieldsSearched.push(fieldName);
    }

    if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
      return { _id: params.search };
    } else {

      _.each(model.schema.paths, function (value, key) {
        if (searchFields && searchFields.indexOf(value.path) === -1) {
          return null;
        }
        var condition = {};

        var searchValue = params.search.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&');
        var searchRegexp = new RegExp('.*' + searchValue + '.*', 'i');

        if (value.instance === 'ObjectID') {
          try {
            condition[key] = opts.mongoose.Types.ObjectId(params.search);
            pushCondition(condition, key);
          } catch(error) { return null; }
        } else if (value.instance === 'String') {
          condition[key] = searchRegexp;
          pushCondition(condition, key);
        } else if (value.instance === 'Array') {
          var field = _.findWhere(schema.fields, { field: key });
          if (field && _.isArray(field.type) && field.type[0] === 'String' &&
            !field.reference) {
            condition[key] = searchRegexp;
            pushCondition(condition, key);
          } else if (field && _.isArray(field.type) &&
            !field.reference && parseInt(params.searchExtended)) {
            var elemMatch = { $elemMatch: { $or: [], } };

            field.type[0].fields.forEach(function(subField) {
              var query = {};
              if (subField.type === 'String' &&
                !value.schema.obj[subField.field].ref) {
                query[subField.field] = searchRegexp;
                elemMatch.$elemMatch.$or.push(query);
              } else if (subField.type === 'Number' &&
                parseInt(params.search)) {
                query[subField.field] = parseInt(params.search);
                elemMatch.$elemMatch.$or.push(query);
              }
            });
            condition[key] = elemMatch;
            pushCondition(condition, key);
          }
        }
      });

      return orQuery.$or.length ? orQuery : {};
    }
  };

  this.getWhere = function (query) {
    query.where(this.getConditions());
  };
}

module.exports = SearchBuilder;
