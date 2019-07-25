import { expect } from 'chai';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import FiltersParser from '../../../src/services/filters-parser';
import mongooseConnect from '../../utils/mongoose-connect';
import { InvalidFiltersFormatError, NoMatchingOperatorError } from '../../../src/services/errors';

describe('Service > ResourcesGetter', () => {
  let IslandModel;
  let defaultParser;
  const timezone = 'Europe/Paris';

  const options = {
    mongoose,
    connections: [mongoose],
  };

  before(() => {
    Interface.Schemas = {
      schemas: {
        Island: {
          name: 'Island',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'String' },
            { field: 'size', type: 'Number' },
            { field: 'isBig', type: 'Boolean' },
            { field: 'inhabitedOn', type: 'Date' },
          ],
        },
      },
    };

    return mongooseConnect()
      .then(() => {
        const IslandSchema = mongoose.Schema({
          id: { type: Number },
          name: { type: String },
          size: { type: Number },
          isBig: { type: Boolean },
          inhabitedOn: { type: Date },
        });

        IslandModel = mongoose.model('Island', IslandSchema);

        defaultParser = new FiltersParser(IslandModel, timezone, options);
        return IslandModel.remove({});
      })
      .then(() => {
        return loadFixture(IslandModel, [
          {
            // id: 100,
            name: 'Pyk',
            size: 13,
            isBig: false,
            inhabitedOn: '2019-02-11T23:00:00.000Z',
          },
          {
            // id: 101,
            name: 'Dragonstone',
            size: 124,
            isBig: true,
            inhabitedOn: '2018-03-21T23:00:00.000Z',
          },
        ]);
      });
  });

  after((done) => {
    mongoose.connection.close();
    done();
  });

  describe('formatAggregation function', () => {
    it('should format correctly flat condition', () => {
      expect(defaultParser.formatAggregation({ field: 'name', operator: 'contains', value: 'y' })).to.deep.equal({ name: new RegExp('.*y.*') });
    });

    it('should format correctly aggregated conditions', () => {
      expect(defaultParser.formatAggregation({
        aggregator: 'and',
        conditions: [
          { field: 'name', operator: 'contains', value: 'y' },
          { field: 'size', operator: 'less_than', value: 455 },
        ],
      })).to.deep.equal({ $and: [{ name: new RegExp('.*y.*') }, { size: { $lt: 455 } }] });
    });

    it('should format correctly nested conditions', () => {
      const nestedCondition = {
        aggregator: 'and',
        conditions: [
          { field: 'size', operator: 'greater_than', value: '56' },
          {
            aggregator: 'or',
            conditions: [
              { field: 'name', operator: 'starts_with', value: 'P' },
              { field: 'isBig', operator: 'equal', value: 'true' },
            ],
          },
        ],
      };
      const expectedResult = {
        $and: [
          { size: { $gt: 56 } },
          { $or: [{ name: new RegExp('^P.*') }, { isBig: true }] },
        ],
      };
      expect(defaultParser.formatAggregation(nestedCondition)).to.deep.equal(expectedResult);
    });

    it('should throw an error on empty condition', () => {
      expect(() => defaultParser.formatAggregation()).to.throw(InvalidFiltersFormatError);
      expect(() => defaultParser.formatAggregation({})).to.throw(InvalidFiltersFormatError);
    });
  });


  describe('formatCondition function', () => {
    it('should format correctly conditions', () => {
      expect(defaultParser.formatCondition({ field: 'name', operator: 'starts_with', value: 'P' })).to.deep.equal({ name: new RegExp('^P.*') });
      expect(defaultParser.formatCondition({ field: 'isBig', operator: 'equal', value: 'true' })).to.deep.equal({ isBig: true });
      expect(defaultParser.formatCondition({ field: 'size', operator: 'greater_than', value: '56' })).to.deep.equal({ size: { $gt: 56 } });
    });

    it('should throw an error on empty condition', () => {
      expect(() => defaultParser.formatCondition()).to.throw(InvalidFiltersFormatError);
      expect(() => defaultParser.formatCondition({})).to.throw(InvalidFiltersFormatError);
    });

    it('should throw an error on badly formated condition', () => {
      expect(() => defaultParser.formatCondition({ operator: 'contains' })).to.throw(InvalidFiltersFormatError);
    });
  });

  describe('formatAggregatorOperator function', () => {
    it('\'or\' should return a valid aggregator', () => {
      expect(defaultParser.formatAggregatorOperator('or')).to.equal('$or');
    });

    it('\'and\' should return a valid aggregator', () => {
      expect(defaultParser.formatAggregatorOperator('and')).to.equal('$and');
    });

    it('unhandled aggregator should throw an error', () => {
      expect(defaultParser.formatAggregatorOperator.bind('toto')).to.throw(NoMatchingOperatorError);
    });
  });

  describe('formatOperatorValue function', () => {
    describe('on string field', () => {
      const values = [5, 'toto', null];

      values.forEach((value) => {
        it(`should return the appropriate operator/value (${typeof value})`, () => {
          expect(defaultParser.formatOperatorValue('name', 'starts_with', value)).deep.equal(new RegExp(`^${value}.*`));
          expect(defaultParser.formatOperatorValue('name', 'ends_with', value)).deep.equal(new RegExp(`.*${value}$`));
          expect(defaultParser.formatOperatorValue('name', 'contains', value)).deep.equal(new RegExp(`.*${value}.*`));
          expect(defaultParser.formatOperatorValue('name', 'not', value)).deep.equal({ $ne: value });
          expect(defaultParser.formatOperatorValue('name', 'greater_than', value)).deep.equal({ $gt: value });
          expect(defaultParser.formatOperatorValue('name', 'less_than', value)).deep.equal({ $lt: value });
          expect(defaultParser.formatOperatorValue('name', 'before', value)).deep.equal({ $lt: value });
          expect(defaultParser.formatOperatorValue('name', 'after', value)).deep.equal({ $gt: value });
          expect(defaultParser.formatOperatorValue('name', 'not_contains', value)).deep.equal({ $not: new RegExp(`.*${value}.*`) });
          expect(defaultParser.formatOperatorValue('name', 'not_equal', value)).deep.equal({ $ne: value });
          expect(defaultParser.formatOperatorValue('name', 'present', value)).deep.equal({ $exists: true });
          expect(defaultParser.formatOperatorValue('name', 'equal', value)).deep.equal(value);
          expect(defaultParser.formatOperatorValue('name', 'blank', value)).deep.equal({ $exists: false });
        });

        it('should raise an error on unknown operator', () => {
          expect(defaultParser.formatOperatorValue.bind(null, 'name', 'random', value)).to.throw(NoMatchingOperatorError);
        });
      });
    });
  });

  describe('formatField function', () => {
    it('should format default field correctly', () => {
      expect(defaultParser.formatField('myField')).equal('myField');
    });

    it('should format nested fields correctly', () => {
      expect(defaultParser.formatField('myCollection:myField')).equal('myCollection.myField');
    });
  });
});
