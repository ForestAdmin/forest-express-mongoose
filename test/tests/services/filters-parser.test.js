import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import FiltersParser from '../../../src/services/filters-parser';
import mongooseConnect from '../../utils/mongoose-connect';
import { NoMatchingOperatorError } from '../../../src/services/errors';

describe('service > filters-parser', () => {
  let IslandModel;
  let islandForestSchema;
  let defaultParser;
  const timezone = 'Europe/Paris';

  const options = {
    Mongoose: mongoose,
    connections: { mongoose },
  };
  const { Types: schemaTypes } = mongoose.Schema;
  const { ObjectId } = mongoose.Types;

  beforeAll(async () => {
    islandForestSchema = {
      name: 'Island',
      idField: 'id',
      primaryKeys: ['id'],
      isCompositePrimary: false,
      searchFields: ['name'],
      fields: [
        { field: 'id', type: 'Number' },
        { field: 'myObjectId', type: 'String' },
        { field: 'name', type: 'String' },
        { field: 'size', type: 'Number' },
        { field: 'isBig', type: 'Boolean' },
        { field: 'inhabitedOn', type: 'Date' },
        { field: 'location@@@latitude', type: 'String' },
        { field: 'location@@@longitude', type: 'String' },
        {
          field: 'location@@@description',
          type: {
            date: 'Date',
            comment: 'String',
          },
        },
        {
          field: 'ships',
          type: {
            fields: [{
              field: 'weapon',
              type: 'String',
            }, {
              field: '_id',
              type: 'ObjectId',
            }],
          },
        },
      ],
    };


    Interface.Schemas = {
      schemas: {
        Island: islandForestSchema,
      },
    };

    await mongooseConnect();
    const IslandSchema = new mongoose.Schema({
      id: { type: Number },
      myObjectId: { type: schemaTypes.ObjectId },
      name: { type: String },
      size: { type: Number },
      isBig: { type: Boolean },
      inhabitedOn: { type: Date },
      location: {
        type: {
          latitude: { type: String },
          longitude: { type: String },
          description: {
            type: {
              date: { type: Date },
              comment: { type: String },
            },
          },
        },
      },
      ships: {
        type: {
          weapon: { type: 'String' },
          _id: { type: schemaTypes.ObjectId },
        },
      },
    });

    IslandModel = mongoose.model('Island', IslandSchema);

    defaultParser = new FiltersParser(IslandModel, timezone, options);
    await IslandModel.deleteMany({});
    await loadFixture(IslandModel, [
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

  afterAll(() => mongoose.connection.close());

  afterEach(() => jest.restoreAllMocks());

  describe('getParserForType', () => {
    describe('with a String type', () => {
      it('should return the default parser', () => {
        expect.assertions(3);

        expect(defaultParser.getParserForType(String)('a string'))
          .toStrictEqual('a string');
        expect(defaultParser.getParserForType('String')('a string'))
          .toStrictEqual('a string');
        expect(defaultParser.getParserForType(schemaTypes.String)('a string'))
          .toStrictEqual('a string');
      });

      it('should not try to cast it to ObjectId', () => {
        expect.assertions(1);

        const parser = defaultParser.getParserForType('String');

        expect(parser('53c2ae8528d75d572c06adbc')).toStrictEqual('53c2ae8528d75d572c06adbc');
      });
    });

    describe('with an ObjectId type', () => {
      it('should return the objectId parser', () => {
        expect.assertions(2);

        expect(defaultParser.getParserForType(schemaTypes.ObjectId)('53c2ae8528d75d572c06adbc'))
          .toBeInstanceOf(mongoose.Types.ObjectId);
        expect(defaultParser.getParserForType('ObjectId')('53c2ae8528d75d572c06adbc'))
          .toBeInstanceOf(mongoose.Types.ObjectId);
      });

      it('should try to cast it to ObjectId', () => {
        expect.assertions(4);

        const parser = defaultParser.getParserForType('ObjectId');

        expect(parser('53c2ae8528d75d572c06adbc')).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(parser(new ObjectId('53c2ae8528d75d572c06adbc'))).toBeInstanceOf(mongoose.Types.ObjectId);
        expect(parser('53c2ae8528d75d572c06adbcc')).not.toBeInstanceOf(mongoose.Types.ObjectId);
        expect(parser('star wars with the same ')).not.toBeInstanceOf(mongoose.Types.ObjectId);
      });
    });

    describe('with an Number type', () => {
      it('should return the Number parser', () => {
        expect.assertions(3);

        expect(defaultParser.getParserForType(Number)('10'))
          .toBeNumber();
        expect(defaultParser.getParserForType('Number')('10'))
          .toBeNumber();
        expect(defaultParser.getParserForType(schemaTypes.Number)('10'))
          .toBeNumber();
      });

      it('should parse the input to its Number', () => {
        expect.assertions(1);

        expect(defaultParser.getParserForType(Number)('10'))
          .toBeNumber();
      });
    });

    describe('with a Date type', () => {
      it('should return the date parser', () => {
        expect.assertions(3);

        expect(defaultParser.getParserForType(Date)(Date.now()))
          .toBeDate();
        expect(defaultParser.getParserForType('Date')(Date.now()))
          .toBeDate();
        expect(defaultParser.getParserForType(schemaTypes.Date)(Date.now()))
          .toBeDate();
      });

      it('should parse the date', () => {
        expect.assertions(1);

        const date = Date.now();
        expect(defaultParser.getParserForType(Date)(date))
          .toStrictEqual(new Date(date));
      });
    });

    describe('with a Boolean type', () => {
      it('should return the Boolean parser', () => {
        expect.assertions(3);

        expect(defaultParser.getParserForType(Boolean)('true'))
          .toBeBoolean();
        expect(defaultParser.getParserForType('Boolean')('true'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(schemaTypes.Boolean)('true'))
          .toBeBoolean();
      });

      it('should cast values to boolean', () => {
        expect.assertions(9);

        expect(defaultParser.getParserForType(Boolean)('true'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)('false'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)('yes'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)('no'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)('1'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)('0'))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)(true))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)(false))
          .toBeBoolean();
        expect(defaultParser.getParserForType(Boolean)('not a boolean'))
          .toBeNull();
      });
    });

    describe('with any other type', () => {
      it('should return the default parser', () => {
        expect.assertions(5);

        const map = new Map();
        expect(defaultParser.getParserForType(Map)(map))
          .toStrictEqual(map);
        expect(defaultParser.getParserForType(Buffer)('test'))
          .toStrictEqual('test');
        expect(defaultParser.getParserForType(schemaTypes.Mixed)('test'))
          .toStrictEqual('test');
        expect(defaultParser.getParserForType(schemaTypes.Decimal128)('test'))
          .toStrictEqual('test');
        expect(defaultParser.getParserForType(['String'])('test'))
          .toStrictEqual('test');
      });
    });
  });

  describe('getParserForField', () => {
    describe('with an embedded field', () => {
      it('should return the parser for the nested field', async () => {
        expect.assertions(6);

        const fakeParser = jest.fn().mockReturnValue('parsedValue');
        const spy = jest.spyOn(defaultParser, 'getParserForType').mockReturnValue(fakeParser);

        const parserForField = await defaultParser.getParserForField('ships:weapon');

        expect(defaultParser.getParserForType).toHaveBeenCalledTimes(1);
        expect(defaultParser.getParserForType).toHaveBeenCalledWith('String');

        expect(fakeParser).not.toHaveBeenCalled();

        expect(parserForField('myValue')).toStrictEqual('parsedValue');

        expect(fakeParser).toHaveBeenCalledTimes(1);
        expect(fakeParser).toHaveBeenCalledWith('myValue');

        spy.mockRestore();
      });

      describe('with a nested ObjectId', () => {
        it('should return the parser for the nested field', async () => {
          expect.assertions(6);

          const fakeParser = jest.fn().mockReturnValue('parsedValue');
          const spy = jest.spyOn(defaultParser, 'getParserForType').mockReturnValue(fakeParser);

          const parserForField = await defaultParser.getParserForField('ships:_id');

          expect(defaultParser.getParserForType).toHaveBeenCalledTimes(1);
          expect(defaultParser.getParserForType).toHaveBeenCalledWith(schemaTypes.ObjectId);

          expect(fakeParser).not.toHaveBeenCalled();

          expect(parserForField('myValue')).toStrictEqual('parsedValue');

          expect(fakeParser).toHaveBeenCalledTimes(1);
          expect(fakeParser).toHaveBeenCalledWith('myValue');

          spy.mockRestore();
        });
      });
    });

    describe('with a String', () => {
      it('should return the string parser', async () => {
        expect.assertions(6);

        const fakeParser = jest.fn().mockReturnValue('parsedValue');
        const spy = jest.spyOn(defaultParser, 'getParserForType').mockReturnValue(fakeParser);

        const parserForField = await defaultParser.getParserForField('name');

        expect(defaultParser.getParserForType).toHaveBeenCalledTimes(1);
        expect(defaultParser.getParserForType).toHaveBeenCalledWith(String);

        expect(fakeParser).not.toHaveBeenCalled();

        expect(parserForField('myValue')).toStrictEqual('parsedValue');

        expect(fakeParser).toHaveBeenCalledTimes(1);
        expect(fakeParser).toHaveBeenCalledWith('myValue');

        spy.mockRestore();
      });
    });

    describe('with an ObjectId', () => {
      it('should return the ObjectId parser', async () => {
        expect.assertions(6);

        const fakeParser = jest.fn().mockReturnValue('parsedValue');
        const spy = jest.spyOn(defaultParser, 'getParserForType').mockReturnValue(fakeParser);

        const parserForField = await defaultParser.getParserForField('myObjectId');

        expect(defaultParser.getParserForType).toHaveBeenCalledTimes(1);
        expect(defaultParser.getParserForType).toHaveBeenCalledWith(schemaTypes.ObjectId);

        expect(fakeParser).not.toHaveBeenCalled();

        expect(parserForField('myValue')).toStrictEqual('parsedValue');

        expect(fakeParser).toHaveBeenCalledTimes(1);
        expect(fakeParser).toHaveBeenCalledWith('myValue');

        spy.mockRestore();
      });
    });
  });

  describe('formatAggregation function', () => {
    describe('on aggregated conditions', () => {
      it('should format correctly', async () => {
        expect.assertions(1);
        expect(await defaultParser.formatAggregation('and', [
          { name: new RegExp('.*y.*') },
          { size: { $lt: 455 } },
        ])).toStrictEqual({ $and: [{ name: new RegExp('.*y.*') }, { size: { $lt: 455 } }] });
      });
    });

    describe('on nested conditions', () => {
      it('should format correctly', async () => {
        expect.assertions(1);
        const formattedConditions = [
          { size: { $gt: 56 } },
          { $or: [{ name: new RegExp('^P.*') }, { isBig: true }] },
        ];
        expect(await defaultParser.formatAggregation('and', formattedConditions)).toStrictEqual({ $and: formattedConditions });
      });
    });

    describe('on empty condition', () => {
      it('should throw an error', async () => {
        expect.assertions(3);
        await expect(defaultParser.formatAggregation()).rejects.toThrow(NoMatchingOperatorError);
        await expect(defaultParser.formatAggregation({})).rejects.toThrow(NoMatchingOperatorError);
        await expect(defaultParser.formatAggregation({ aggregator: 'unknown' })).rejects.toThrow(NoMatchingOperatorError);
      });
    });
  });


  describe('formatCondition function', () => {
    it('should format conditions correctly', async () => {
      expect.assertions(4);
      expect(await defaultParser.formatCondition({ field: 'name', operator: 'starts_with', value: 'P' })).toStrictEqual({ name: new RegExp('^P.*') });
      expect(await defaultParser.formatCondition({ field: 'isBig', operator: 'equal', value: 'true' })).toStrictEqual({ isBig: true });
      expect(await defaultParser.formatCondition({ field: 'size', operator: 'greater_than', value: '56' })).toStrictEqual({ size: { $gt: 56 } });
      expect(await defaultParser.formatCondition({ field: 'name', operator: 'in', value: 'Pyk, Dragonstone ' })).toStrictEqual({ name: { $in: ['Pyk', 'Dragonstone'] } });
    });

    describe('on a smart field', () => {
      it('should call formatOperatorValue', async () => {
        expect.assertions(3);

        const formattedCondition = 'myFormattedCondition';
        jest.spyOn(defaultParser, 'formatOperatorValue').mockReturnValue(formattedCondition);

        const condition = {
          field: 'smart name',
          operator: 'present',
          value: null,
        };
        expect(await defaultParser.formatCondition(condition, true))
          .toStrictEqual(formattedCondition);

        expect(defaultParser.formatOperatorValue).toHaveBeenCalledTimes(1);
        expect(defaultParser.formatOperatorValue).toHaveBeenCalledWith('smart name', 'present', null);
      });
    });
  });

  describe('formatAggregatorOperator function', () => {
    it('\'or\' should return a valid aggregator', () => {
      expect.assertions(1);
      expect(defaultParser.formatAggregatorOperator('or')).toStrictEqual('$or');
    });

    it('\'and\' should return a valid aggregator', () => {
      expect.assertions(1);
      expect(defaultParser.formatAggregatorOperator('and')).toStrictEqual('$and');
    });

    it('unhandled aggregator should throw an error', () => {
      expect.assertions(1);
      expect(defaultParser.formatAggregatorOperator.bind('toto')).toThrow(NoMatchingOperatorError);
    });
  });

  describe('formatOperatorValue function', () => {
    describe('on string field', () => {
      const values = [5, 'toto', null];

      values.forEach((value) => {
        it(`should return the appropriate operator/value (${typeof value})`, async () => {
          expect.assertions(13);
          expect(await defaultParser.formatOperatorValue('name', 'starts_with', value)).toStrictEqual(new RegExp(`^${value}.*`));
          expect(await defaultParser.formatOperatorValue('name', 'ends_with', value)).toStrictEqual(new RegExp(`.*${value}$`));
          expect(await defaultParser.formatOperatorValue('name', 'contains', value)).toStrictEqual(new RegExp(`.*${value}.*`));
          expect(await defaultParser.formatOperatorValue('name', 'not', value)).toStrictEqual({ $ne: value });
          expect(await defaultParser.formatOperatorValue('name', 'greater_than', value)).toStrictEqual({ $gt: value });
          expect(await defaultParser.formatOperatorValue('name', 'less_than', value)).toStrictEqual({ $lt: value });
          expect(await defaultParser.formatOperatorValue('name', 'before', value)).toStrictEqual({ $lt: value });
          expect(await defaultParser.formatOperatorValue('name', 'after', value)).toStrictEqual({ $gt: value });
          expect(await defaultParser.formatOperatorValue('name', 'not_contains', value)).toStrictEqual({ $not: new RegExp(`.*${value}.*`) });
          expect(await defaultParser.formatOperatorValue('name', 'not_equal', value)).toStrictEqual({ $ne: value });
          expect(await defaultParser.formatOperatorValue('name', 'present', value)).toStrictEqual({ $exists: true, $ne: null });
          expect(await defaultParser.formatOperatorValue('name', 'equal', value)).toStrictEqual(value);
          expect(await defaultParser.formatOperatorValue('name', 'blank', value)).toStrictEqual({ $in: [null, ''] });
        });

        it('should raise an error on unknown operator', async () => {
          expect.assertions(1);
          await expect(defaultParser.formatOperatorValue('name', 'random', value))
            .rejects.toThrow(NoMatchingOperatorError);
        });
      });
    });
  });

  describe('formatField function', () => {
    it('should format default field correctly', () => {
      expect.assertions(1);
      expect(defaultParser.formatField('myField')).toStrictEqual('myField');
    });

    it('should format nested fields correctly', () => {
      expect.assertions(1);
      expect(defaultParser.formatField('myCollection:myField')).toStrictEqual('myCollection.myField');
    });
  });

  describe('querying on a flattened field', () => {
    describe('querying on a first level field', () => {
      it('should un-flatten the flattened field', async () => {
        expect.assertions(1);

        const condition = {
          field: 'location@@@longitude',
          operator: 'present',
          value: null,
        };

        const newCondition = await defaultParser.formatCondition(condition);

        expect(newCondition['location.longitude']).toStrictEqual({ $exists: true, $ne: null });
      });
    });

    describe('querying on nested field form flattened field', () => {
      it('should un-flatten the flattened field', async () => {
        expect.assertions(1);

        const condition = {
          field: 'location@@@description:comment',
          operator: 'present',
          value: null,
        };

        const newCondition = await defaultParser.formatCondition(condition);

        expect(newCondition['location.description.comment']).toStrictEqual({ $exists: true, $ne: null });
      });
    });
  });
});
