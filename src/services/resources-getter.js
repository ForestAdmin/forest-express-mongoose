import P from 'bluebird';
import _ from 'lodash';
import Interface from 'forest-express';
import OperatorValueParser from './operator-value-parser';
import SearchBuilder from './search-builder';
import FilterParser from './filter-parser';
import utils from '../utils/schema';
import mongooseUtils from './mongoose-utils';

function ResourcesGetter(model, opts, params) {
  const schema = Interface.Schemas.schemas[utils.getModelName(model)];
  let segment;

  const searchBuilder = new SearchBuilder(model, opts, params, schema.searchFields);
  let hasSmartFieldSearch = false;

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    return hasPagination() && params.page.size ? parseInt(params.page.size, 10) : 10;
  }

  function getSkip() {
    return hasPagination() ? (parseInt(params.page.number, 10) - 1) * getLimit() : 0;
  }

  function refilterBasedOnFilters(records) {
    return P.filter(records, (record) => {
      let ret = true;

      // Refilter record based on the populated match.
      _.each(params.filter, (value, key) => {
        if (key.indexOf(':') > -1) {
          const fieldName = key.split(':')[0];

          const field = _.find(schema.fields, { field: fieldName });
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
    let ret = false;

    _.each(params.filter, (value, key) => {
      if (key.indexOf(':') > -1) {
        ret = true;
      }
    });

    return ret;
  }

  function count(query) {
    return new P((resolve, reject) => {
      query.count((err, currentCount) => (err ? reject(err) : resolve(currentCount)));
    });
  }

  function populateWhere(field) {
    const filter = {};
    const conditions = [];

    _.each(params.filter, (values, key) => {
      if (key.indexOf(':') > -1) {
        const splitted = key.split(':');
        const fieldName = splitted[0];
        const subFieldName = splitted[1];

        if (fieldName === field.field) {
          const currentField = _.find(schema.fields, { field: fieldName });
          if (currentField && currentField.reference) {
            // NOTICE: Look for the associated model infos
            const subModel = _.find(mongooseUtils.getModels(opts), currentModel =>
              utils.getModelName(currentModel) === currentField.reference.split('.')[0]);

            values.split(',').forEach((value) => {
              const condition = {};
              condition[subFieldName] = new OperatorValueParser(opts, params.timezone)
                .perform(subModel, subFieldName, value);
              conditions.push(condition);
            });
          }
        }
      }
    });

    if (params.filterType && conditions.length > 0) {
      filter[`$${params.filterType}`] = conditions;
    }
    return filter;
  }

  function handlePopulate(query) {
    _.each(schema.fields, (field) => {
      if (field.reference) {
        query.populate({
          path: field.field,
          match: populateWhere(field),
        });
      }
    });
  }

  function handleFilterParams(query) {
    const operator = `$${params.filterType}`;
    const queryFilters = {};
    queryFilters[operator] = [];

    _.each(params.filter, (values, key) => {
      const conditions = new FilterParser(model, opts, params.timezone).perform(key, values);
      _.each(conditions, condition => queryFilters[operator].push(condition));
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
    const query = model.find();

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
      _.each(schema.fields, (field) => {
        if (field.search) {
          try {
            field.search(query, params.search);
            hasSmartFieldSearch = true;
          } catch (error) {
            Interface.logger.error(`Cannot search properly on Smart Field ${field.field}`, error);
          }
        }
      });
    }

    return query;
  }

  function exec(query) {
    return new P((resolve, reject) => {
      if (params.sort) {
        handleSortParam(query);
      }

      if (!hasRelationshipFilter()) {
        query
          .limit(getLimit())
          .skip(getSkip());
      }

      query.exec((err, records) => (err ? reject(err) : resolve(records)));
    }).then(records => (hasRelationshipFilter() ? refilterBasedOnFilters(records) : records));
  }

  function getSegment() {
    if (schema.segments && params.segment) {
      segment = _.find(schema.segments, currentSegment => currentSegment.name === params.segment);
    }
  }

  function getSegmentCondition() {
    getSegment();
    if (segment && segment.where && typeof segment.where === 'function') {
      return segment.where()
        .then((where) => {
          segment.where = where;
        });
    }
    return new P(resolve => resolve());
  }

  this.perform = () => getSegmentCondition()
    .then(() => {
      const query = getRecordsQuery();

      if (hasRelationshipFilter()) {
        return exec(query)
          .then((records) => {
            records = records.slice(getSkip(), getSkip() + getLimit());
            return records;
          });
      }

      return exec(query);
    })
    .then((records) => {
      let fieldsSearched = null;

      if (params.search) {
        fieldsSearched = searchBuilder.getFieldsSearched();
        if (fieldsSearched.length === 0 && !hasSmartFieldSearch) {
          // NOTICE: No search condition has been set for the current search,
          //         no record can be found.
          return [[], 0];
        }
      }

      return [records, fieldsSearched];
    });

  this.count = () => getSegmentCondition()
    .then(() => {
      const query = getRecordsQuery();

      return hasRelationshipFilter() ? exec(query).then(records => records.length) : count(query);
    });
}

module.exports = ResourcesGetter;
