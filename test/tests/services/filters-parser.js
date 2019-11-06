import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import FiltersParser from '../../../src/services/filters-parser';
import mongooseConnect from '../../utils/mongoose-connect';
import { InvalidFiltersFormatError, NoMatchingOperatorError } from '../../../src/services/errors';

chai.use(chaiAsPromised);

describe('Service > FiltersParser', () => {
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
    context('on aggregated conditions', () => {
      it('should format correctly', async () => {
        expect(await defaultParser.formatAggregation('and', [
          { name: new RegExp('.*y.*') },
          { size: { $lt: 455 } },
        ])).to.deep.equal({ $and: [{ name: new RegExp('.*y.*') }, { size: { $lt: 455 } }] });
      });
    });

    context('on nested conditions', () => {
      it('should format correctly', async () => {
        const formattedConditions = [
          { size: { $gt: 56 } },
          { $or: [{ name: new RegExp('^P.*') }, { isBig: true }] },
        ];
        expect(await defaultParser.formatAggregation('and', formattedConditions)).to.deep.equal({ $and: formattedConditions });
      });
    });

    context('on empty condition', () => {
      it('should throw an error', () => {
        expect(defaultParser.formatAggregation()).to.be.rejectedWith(NoMatchingOperatorError);
        expect(defaultParser.formatAggregation({})).to.be.rejectedWith(NoMatchingOperatorError);
        expect(defaultParser.formatAggregation({ aggregator: 'unknown' })).to.be.rejectedWith(NoMatchingOperatorError);
      });
    });
  });


  describe('formatCondition function', () => {
    it('should format conditions correctly', async () => {
      expect(await defaultParser.formatCondition({ field: 'name', operator: 'starts_with', value: 'P' })).to.deep.equal({ name: new RegExp('^P.*') });
      expect(await defaultParser.formatCondition({ field: 'isBig', operator: 'equal', value: 'true' })).to.deep.equal({ isBig: true });
      expect(await defaultParser.formatCondition({ field: 'size', operator: 'greater_than', value: '56' })).to.deep.equal({ size: { $gt: 56 } });
    });

    context('on empty condition', () => {
      it('should throw an error', () => {
        expect(defaultParser.formatCondition()).to.be.rejectedWith(InvalidFiltersFormatError);
        expect(defaultParser.formatCondition({})).to.be.rejectedWith(InvalidFiltersFormatError);
      });
    });

    context('on badly formated condition', () => {
      it('should throw an error', () => {
        expect(defaultParser.formatCondition({ operator: 'contains', value: 'it' })).to.be.rejectedWith(InvalidFiltersFormatError);
        expect(defaultParser.formatCondition({ field: 'name', operator: 'contains' })).to.be.rejectedWith(InvalidFiltersFormatError);
        expect(defaultParser.formatCondition({ field: 'name', value: 'it' })).to.be.rejectedWith(InvalidFiltersFormatError);
        expect(defaultParser.formatCondition({ field: 'name', operator: 'con', value: 'it' })).to.be.rejectedWith(NoMatchingOperatorError);
        expect(defaultParser.formatCondition('toto')).to.be.rejectedWith(InvalidFiltersFormatError);
        expect(defaultParser.formatCondition(['toto'])).to.be.rejectedWith(InvalidFiltersFormatError);
        expect(defaultParser.formatCondition({ field: 'toto', operator: 'contains', value: 'it' })).to.be.rejectedWith(InvalidFiltersFormatError);
      });
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
        it(`should return the appropriate operator/value (${typeof value})`, async () => {
          expect(await defaultParser.formatOperatorValue('name', 'starts_with', value)).deep.equal(new RegExp(`^${value}.*`));
          expect(await defaultParser.formatOperatorValue('name', 'ends_with', value)).deep.equal(new RegExp(`.*${value}$`));
          expect(await defaultParser.formatOperatorValue('name', 'contains', value)).deep.equal(new RegExp(`.*${value}.*`));
          expect(await defaultParser.formatOperatorValue('name', 'not', value)).deep.equal({ $ne: value });
          expect(await defaultParser.formatOperatorValue('name', 'greater_than', value)).deep.equal({ $gt: value });
          expect(await defaultParser.formatOperatorValue('name', 'less_than', value)).deep.equal({ $lt: value });
          expect(await defaultParser.formatOperatorValue('name', 'before', value)).deep.equal({ $lt: value });
          expect(await defaultParser.formatOperatorValue('name', 'after', value)).deep.equal({ $gt: value });
          expect(await defaultParser.formatOperatorValue('name', 'not_contains', value)).deep.equal({ $not: new RegExp(`.*${value}.*`) });
          expect(await defaultParser.formatOperatorValue('name', 'not_equal', value)).deep.equal({ $ne: value });
          expect(await defaultParser.formatOperatorValue('name', 'present', value)).deep.equal({ $exists: true });
          expect(await defaultParser.formatOperatorValue('name', 'equal', value)).deep.equal(value);
          expect(await defaultParser.formatOperatorValue('name', 'blank', value)).deep.equal({ $exists: false });
        });

        it('should raise an error on unknown operator', () => {
          expect(defaultParser.formatOperatorValue('name', 'random', value)).to.be.rejectedWith(NoMatchingOperatorError);
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
