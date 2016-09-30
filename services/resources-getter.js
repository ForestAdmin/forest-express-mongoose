'use strict';
var P = require('bluebird');
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var FilterParser = require('./filter-parser');
var Interface = require('forest-express');
var utils = require('../utils/schema');

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      if (params.page.size) {
        return parseInt(params.page.size);
      } else {
        return 10;
      }
    } else {
      return 10;
    }
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number) - 1) * getLimit();
    } else {
      return 0;
    }
  }

  function refilterBasedOnFilters(records) {
    return P.filter(records, function (record) {
      var ret = true;

      // Refilter record based on the populated match.
      _.each(params.filter, function (value, key) {
        if (key.indexOf(':') > -1) {
          var fieldName = key.split(':')[0];

          var field = _.findWhere(schema.fields, { field: fieldName });
          if (field && field.reference) {
            if (_.isArray(field.type)) {
              ret = !!(ret && record[fieldName] && record[fieldName].length);
            } else {
              ret = !!(ret && record[fieldName]);
            }
          } else {
            ret = true;
          }
        }
      });

      return ret;
    });
  }

  function hasRelationshipFilter() {
    var ret = false;

    _.each(params.filter, function (value, key) {
      if (key.indexOf(':') > -1) {
        ret = true;
      }
    });

    return ret;
  }

  function count (query) {
    return new P(function (resolve, reject) {
      query.count(function (err, count) {
        if (err) { return reject(err); }
        resolve(count);
      });
    });
  }

  function populateWhere(field) {
    var filter = {};
    var conditions = [];

    _.each(params.filter, function (values, key) {
      if (key.indexOf(':') > -1) {
        var splitted = key.split(':');
        var fieldName = splitted[0];
        var subFieldName = splitted[1];

        if (fieldName === field.field) {
          var currentField = _.findWhere(schema.fields, { field: fieldName });
          if (currentField && currentField.reference) {
            // NOTICE: Look for the associated model infos
            var subModel = _.find(opts.mongoose.models, function(model) {
              return model.collection.name ===
                currentField.reference.split('.')[0];
            });

            values.split(',').forEach(function (value) {
              var condition = {};
              condition[subFieldName] = new OperatorValueParser(opts)
                .perform(subModel, subFieldName, value);
              conditions.push(condition);
            });
          }
        }
      }
    });

    if (params.filterType && conditions.length > 0) {
      filter['$' + params.filterType] = conditions;
    }
    return filter;
  }

  function handlePopulate(query) {
    _.each(schema.fields, function (field) {
      if (field.reference) {
        query.populate({
          path: field.field,
          match: populateWhere(field)
        });
      }
    });
  }

  function handleSearchParam(query) {
    if (new RegExp('^[0-9a-fA-F]{24}$').test(params.search)) {
      query.where({ _id: params.search });
    } else {
      var orQuery = { $or: [] };

      _.each(model.schema.paths, function (value, key) {
        if (value.instance === 'String') {
          var q = {};
          q[key] = new RegExp('.*' + params.search + '.*', 'i');

          orQuery.$or.push(q);
        }
      });

      query.where(orQuery);
    }
  }

  function handleFilterParams(query) {
    var operator = '$' + params.filterType;
    var queryFilters = {};
    queryFilters[operator] = [];

    _.each(params.filter, function (values, key) {
      var conditions = new FilterParser(model, opts).perform(key, values);
      _.each(conditions, (condition) => {
        queryFilters[operator].push(condition);
      });
    });

    query.where(queryFilters);
  }

  function handleSortParam(query) {
    if (params.sort.split('.').length > 1) {
      query.sort(params.sort.split('.')[0]);
    } else {
      query.sort(params.sort);
    }
  }

  function getRecords() {
    var query = model.find();

    handlePopulate(query);

    if (params.search) {
      handleSearchParam(query);
    }

    if (params.filter) {
      handleFilterParams(query);
    }

    return query;
  }

  function exec(query) {
    return new P(function (resolve, reject) {
      if (params.sort) {
        handleSortParam(query);
      }

      if (!hasRelationshipFilter()) {
        query
          .limit(getLimit())
          .skip(getSkip());
      }

      query
        .lean()
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve(records);
        });
    }).then(function (records) {
      if (hasRelationshipFilter()) {
        return refilterBasedOnFilters(records);
      } else {
        return records;
      }
    });
  }

  this.perform = function () {
    var query = getRecords();

    if (hasRelationshipFilter()) {
      return exec(getRecords())
        .then(function (records) {
          var count = records.length;
          records = records.slice(getSkip(), getSkip() + getLimit());
          return [count, records];
        });
    } else {
      return P.all([count(query), exec(getRecords())]);
    }
  };
}

module.exports = ResourcesGetter;
