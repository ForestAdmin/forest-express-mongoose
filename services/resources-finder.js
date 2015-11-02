'use strict';
var P = require('bluebird');
var _ = require('lodash');
var Schemas = require('../generators/schemas');
var OperatorValueParser = require('./operator-value-parser');
var SchemaUtils = require('../utils/schema');

function ResourcesFinder(model, opts, params) {
  var schema = Schemas.schemas[model.collection.name];

  function fetchIncludes(records) {
    return P.each(records, function (record) {
      return P.map(Object.keys(params.include), function (fieldName) {
        var reference = params.include[fieldName];
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
    });
  }

  function count (query) {
    return new P(function (resolve, reject) {
      query.count(function (err, count) {
        if (err) { return reject(err); }
        resolve(count);
      });
    });
  }

  function handlePopulate(query) {
    _.each(schema.fields, function (field) {
      if (field.reference) {
        query.populate(field.field);
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

      key = key.replace(/:/g, '.');
      q[key] = new OperatorValueParser(opts).perform(model, key, value);
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

      query
        .limit(getLimit())
        .skip(getSkip())
        .lean()
        .exec(function (err, records) {
          if (err) { return reject(err); }
          resolve(records);
        });
    }).then(function (records) {
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
    return new P.all([count(query), exec(getRecords())]);
  };
}

module.exports = ResourcesFinder;
