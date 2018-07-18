'use strict';
var P = require('bluebird');
var _ = require('lodash');
var OperatorValueParser = require('./operator-value-parser');
var SearchBuilder = require('./search-builder');
var FilterParser = require('./filter-parser');
var Interface = require('forest-express');
var utils = require('../utils/schema');
var mongooseUtils = require('./mongoose-utils');

function ResourcesGetter(model, opts, params) {
  var schema = Interface.Schemas.schemas[utils.getModelName(model)];
  var segment;

  var searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);
  var hasSmartFieldSearch = false;

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
            var subModel = _.find(mongooseUtils.getModels(opts),
              function(model) {
                return utils.getModelName(model) === currentField.reference.split('.')[0];
              });

            values.split(',').forEach(function (value) {
              var condition = {};
              condition[subFieldName] = new OperatorValueParser(opts,
                params.timezone).perform(subModel, subFieldName, value);
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

  function handleFilterParams(query) {
    var operator = '$' + params.filterType;
    var queryFilters = {};
    queryFilters[operator] = [];

    _.each(params.filter, function (values, key) {
      var conditions = new FilterParser(model, opts, params.timezone)
        .perform(key, values);
      _.each(conditions, function (condition) {
        queryFilters[operator].push(condition);
      });
    });

    if (queryFilters[operator].length) {
      query.where(queryFilters);
    }
  }

  function handleSortParam(query) {
    if (params.sort.split('.').length > 1) {
      query.sort(params.sort.split('.')[0]);
    } else {
      query.sort(params.sort);
    }
  }

  function getRecordsQuery() {
    var query = model.find();

    handlePopulate(query);

    if (params.search) {
      searchBuilder.getWhere(query);
    }

    if (params.filter) {
      handleFilterParams(query);
    }

    if (segment) {
      query.where(segment.where);
    }

    if (params.search) {
      _.each(schema.fields, function (field) {
        if (field.search) {
          try {
            field.search(query, params.search);
            hasSmartFieldSearch = true;
          } catch(error) {
            Interface.logger.error('Cannot search properly on Smart Field ' +
              field.field, error);
          }
        }
      });
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

  function getSegment() {
    if (schema.segments && params.segment) {
      segment = _.find(schema.segments, function (segment) {
        return segment.name === params.segment;
      });
    }
  }

  function getSegmentCondition() {
    getSegment();
    if (segment && segment.where && typeof segment.where === 'function') {
      return segment.where()
        .then(function (where) {
          segment.where = where;
          return;
        });
    } else {
      return new P(function (resolve) { return resolve(); });
    }
  }

  this.perform = function () {
    return getSegmentCondition()
      .then(function () {
        var query = getRecordsQuery();

        if (hasRelationshipFilter()) {
          return exec(query)
            .then(function (records) {
              records = records.slice(getSkip(), getSkip() + getLimit());
              return records;
            });
        }

        return exec(query);
      })
      .then(function (records) {
        var fieldsSearched = null;

        if (params.search) {
          fieldsSearched = searchBuilder.getFieldsSearched();
          if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
            // NOTICE: No search condition has been set for the current search, no record can be found.
            return [[], 0];
          }
        }

        return [records, fieldsSearched];
      });
  };

  this.count = function () {
    return getSegmentCondition()
      .then(function () {
        var query = getRecordsQuery();

        if (hasRelationshipFilter()) {
          return exec(query)
            .then(function (records) {
              return records.length;
            });
        }

        return count(query);
      });
  };
}

module.exports = ResourcesGetter;
