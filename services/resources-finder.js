'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Schemas = require('../generators/schemas');
var OperatorValueParser = require('./operator-value-parser');
var IncludeParamParser = require('./include-param-parser');

function ResourcesFinder(model, opts, params) {
  var schema = Schemas.schemas[model.collection.name];

  function fetchIncludes(records) {
    return P.each(records, function (record) {
      return new IncludeParamParser(record, params.include, opts).perform();
    });
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
    var where = {};

    _.each(params.filter, function (value, key) {
      if (key.indexOf(':') > -1) {
        var splitted = key.split(':');
        var fieldName = splitted[0];
        var subFieldName = splitted[1];

        if (fieldName === field.field) {
          var currentField = _.findWhere(schema.fields, { field: fieldName });
          if (currentField && currentField.reference) {
            where[subFieldName] = new OperatorValueParser(opts)
              .perform(model, key, value);
          }
        }
      }
    });

    return where;
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
    _.each(params.filter, function (value, key) {
      var q = {};

      if (key.indexOf(':') > -1) {
        var splitted = key.split(':');
        var fieldName = splitted[0];

        var field = _.findWhere(schema.fields, { field: fieldName });
        if (field && !field.reference) {
          key = key.replace(/:/g, '.');
          q[key] = new OperatorValueParser(opts).perform(model, key, value);
        }
      } else {
        q[key] = new OperatorValueParser(opts).perform(model, key, value);
      }

      query.where(q);
    });
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
      })
      .then(function (records) {
        if (params.include) {
          return fetchIncludes(records);
        } else {
          return records;
        }
      });
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    if (hasPagination()) {
      return params.page.size || 10;
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

module.exports = ResourcesFinder;
