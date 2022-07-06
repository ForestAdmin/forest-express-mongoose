import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesGetter from '../../../src/services/resources-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const user = { renderingId: 1 };
const options = { Mongoose: mongoose, connections: { mongoose } };
const baseParams = {
  fields: {
    order: '_id,amount,description,giftMessage',
  },
  page: { number: '1', size: '30' },
  timezone: 'Europe/Paris',
};

describe('service > resources-getter', () => {
  let OrderModel;
  let UserModel;
  let FilmModel;
  let scopeSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);

    Interface.Schemas = {
      schemas: {
        MyOrders: {
          name: 'Order',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          searchFields: ['amount', 'comment'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'amount', type: 'Number' },
            { field: 'comment', type: 'String' },
            { field: 'giftMessage', type: 'String' },
            { field: 'orderer', type: 'String', reference: 'User._id' },
            { field: 'receiver', type: 'String', reference: 'User._id' },
          ],
        },
        User: {
          name: 'User',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'name', type: 'String' },
            { field: 'age', type: 'Number' },
          ],
        },
        Film: {
          name: 'Film',
          fields: [
            { field: '_id', type: 'String' },
            { field: 'title', type: 'String' },
            { field: 'duration', type: 'Number' },
            {
              field: 'description',
              type: 'String',
              get: (film) => `${film.title} ${film.duration}`,
            },
            { field: 'rating', type: 'Number' },
          ],
        },
      },
    };

    await mongooseConnect();

    const OrderSchema = new mongoose.Schema({
      amount: { type: Number },
      comment: { type: String },
      giftMessage: { type: String },
      orderer: { type: 'ObjectId' },
      receiver: { type: 'ObjectId' },
    });
    const UserSchema = new mongoose.Schema({
      _id: { type: 'ObjectId' },
      name: { type: String },
      age: { type: Number },
    });
    const FilmSchema = new mongoose.Schema({
      _id: { type: 'ObjectId' },
      title: { type: String },
      duration: { type: Number },
      rating: { type: Number },
    });

    OrderModel = mongoose.model('MyOrders', OrderSchema, 'Order');
    UserModel = mongoose.model('User', UserSchema, 'users');
    FilmModel = mongoose.model('Film', FilmSchema, 'films');

    await Promise.all([
      OrderModel.deleteMany({}), UserModel.deleteMany({}), FilmModel.deleteMany({}),
    ]);

    await Promise.all([
      loadFixture(OrderModel, [
        {
          // _id: 100,
          amount: 199,
          comment: 'no comment!',
          giftMessage: 'Here is your gift',
          receiver: '41224d776a326fb40f000002',
        },
        {
          // _id: 101,
          amount: 1399,
          comment: 'this is a gift',
          giftMessage: 'Thank you',
          orderer: '41224d776a326fb40f000001',
        },
        {
          // _id: 102,
          amount: 4000,
          comment: 'Don\'t touch this',
          giftMessage: '',
          orderer: null,
        },
        {
          // _id: 103,
          amount: 5000,
          comment: 'Don\'t touch this',
          giftMessage: null,
          orderer: null,
        },
      ]), loadFixture(UserModel, [
        {
          _id: '41224d776a326fb40f000001',
          age: 49,
          name: 'Rust Cohle',
        },
        {
          _id: '41224d776a326fb40f000002',
          age: 30,
          name: 'Jacco Gardner',
        },
      ]),
      loadFixture(FilmModel, [
        {
          _id: '41224d776a326fb40f000011',
          duration: 149,
          title: 'Terminator',
          rating: 4.5,
        },
        {
          _id: '41224d776a326fb40f000012',
          duration: 360,
          title: 'Titanic',
          rating: 4,
        },
        {
          _id: '41224d776a326fb40f000013',
          duration: 125,
          title: 'Matrix',
        },
      ]),
    ]);
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  describe('with a search on a collection with searchFields', () => {
    it('should retrieve the record with `gift` value in `comment` field', async () => {
      expect.assertions(2);

      const parameters = { ...baseParams, search: 'gift' };
      const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].comment).toMatch(/gift/);
    });

    it('should retrieve the count of the records', async () => {
      expect.assertions(1);

      const parameters = { ...baseParams, search: 'gift' };
      const count = await new ResourcesGetter(OrderModel, options, parameters, user).count();
      expect(count).toStrictEqual(1);
    });
  });

  describe('with a basic flat filter', () => {
    describe('with a "starts_with" operator', () => {
      it('should filter correctly', async () => {
        expect.assertions(3);
        const parameters = {
          ...baseParams,
          filters: JSON.stringify({ field: 'giftMessage', operator: 'starts_with', value: 'Here' }),
        };

        const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
        expect(result[0]).toHaveLength(1);
        expect(result[0][0].giftMessage).toMatch(/^Here/);
        expect(result[0][0].comment).toMatch(/comment/);
      });
    });

    describe('with a "blank" operator', () => {
      it('should filter correctly', async () => {
        expect.assertions(3);
        const parameters = {
          ...baseParams,
          filters: JSON.stringify({ field: 'giftMessage', operator: 'blank', value: null }),
        };

        const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
        expect(result[0]).toHaveLength(2);
        result[0].forEach((item) => {
          if (item.giftMessage === null) {
            expect(item.giftMessage).toBeNull();
          } else {
            expect(item.giftMessage).toStrictEqual('');
          }
        });
      });
    });
  });

  describe('with basic \'and\' aggregator', () => {
    it('should filter correctly', async () => {
      expect.assertions(2);
      const parameters = {
        ...baseParams,
        filters: JSON.stringify({
          aggregator: 'and',
          conditions: [
            { field: 'giftMessage', operator: 'contains', value: 'you' },
            { field: 'amount', operator: 'greater_than', value: '1000' },
          ],
        }),
      };

      const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].comment).toMatch(/gift/);
    });

    describe('with belongsTo filter', () => {
      describe('with flat condition', () => {
        it('should filter correctly', async () => {
          expect.assertions(2);
          const parameters = {
            ...baseParams,
            filters: JSON.stringify({ field: 'orderer:name', operator: 'contains', value: 'Cohle' }),
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
          expect(result[0]).toHaveLength(1);
          expect(result[0][0].comment).toMatch(/gift/);
        });
      });

      describe('with \'and\' aggregator on two belongsTo on the same model', () => {
        it('should filter correctly', async () => {
          expect.assertions(1);

          const parameters = {
            ...baseParams,
            filters: JSON.stringify({
              aggregator: 'and',
              conditions: [
                { field: 'orderer:name', operator: 'contains', value: 'Cohle' },
                { field: 'orderer:name', operator: 'ends_with', value: 'Gardner' },
              ],
            }),
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
          expect(result[0]).toHaveLength(0);
        });
      });

      describe('with \'or\' aggregator on two belongsTo on the same model', () => {
        it('should filter correctly', async () => {
          expect.assertions(1);
          const parameters = {
            ...baseParams,
            filters: JSON.stringify({
              aggregator: 'or',
              conditions: [
                { field: 'orderer:name', operator: 'contains', value: 'Cohle' },
                { field: 'receiver:name', operator: 'ends_with', value: 'Gardner' },
              ],
            }),
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
          expect(result[0]).toHaveLength(2);
        });
      });

      describe('with complex nested filters', () => {
        it('should filter correctly', async () => {
          expect.assertions(1);
          const parameters = {
            ...baseParams,
            filters: JSON.stringify({
              aggregator: 'or',
              conditions: [
                { field: 'orderer:name', operator: 'contains', value: 'elsewhere' },
                {
                  aggregator: 'and',
                  conditions: [
                    { field: 'giftMessage', operator: 'contains', value: 'you' },
                    {
                      aggregator: 'and',
                      conditions: [
                        { field: 'orderer:age', operator: 'blank', value: null },
                        { field: 'receiver:name', operator: 'ends_with', value: 'Gardner' },
                      ],
                    },
                    { field: 'amount', operator: 'less_than', value: '200' },
                  ],
                },
              ],
            }),
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters, user).perform();
          expect(result[0]).toHaveLength(1);
        });
      });
    });
  });

  describe('projection feature', () => {
    describe('with selected smartfield', () => {
      it('should return all fields', async () => {
        expect.assertions(3);
        const parameters = {
          fields: { Film: 'description' },
          page: { number: '1', size: '15' },
          searchExtended: '0',
          timezone: 'Europe/Paris',
        };

        const [result] = await new ResourcesGetter(FilmModel, options, parameters, user).perform();
        expect(result).toHaveLength(3);
        const titles = result.filter((film) => !!film.title);
        expect(titles).toHaveLength(3);
        const durations = result.filter((film) => !!film.duration);
        expect(durations).toHaveLength(3);
      });
    });

    describe('without selected smartfield', () => {
      it('should return only selected fields', async () => {
        expect.assertions(3);
        const parameters = {
          fields: { Film: 'title' },
          page: { number: '1', size: '15' },
          searchExtended: '0',
          timezone: 'Europe/Paris',
        };

        const [result] = await new ResourcesGetter(FilmModel, options, parameters, user).perform();
        expect(result).toHaveLength(3);
        const titles = result.filter((film) => !!film.title);
        expect(titles).toHaveLength(3);
        const durations = result.filter((film) => !!film.duration);
        expect(durations).toHaveLength(0);
      });
    });

    describe('with a condition on a non-filtered field', () => {
      it('should return filtered results on the rating', async () => {
        expect.assertions(1);

        const parameters = {
          fields: { Film: 'title' },
          page: { number: '1', size: '15' },
          filters: '{"field":"rating","operator":"present","value":null}',
          timezone: 'Europe/Paris',
        };

        const result = await new ResourcesGetter(FilmModel, options, parameters, user).perform();

        expect(result[0]).toHaveLength(2);
      });

      it('should return sorted results by rating (asc)', async () => {
        expect.assertions(3);

        const parameters = {
          fields: { Film: 'title' },
          page: { number: '1', size: '15' },
          sort: 'rating',
          timezone: 'Europe/Paris',
        };

        const result = await new ResourcesGetter(FilmModel, options, parameters, user).perform();

        expect(result[0]).toHaveLength(3);
        expect(result[0][0].title).toBe('Matrix');
        expect(result[0][1].title).toBe('Titanic');
      });

      it('should return sorted results by rating (desc)', async () => {
        expect.assertions(3);

        const parameters = {
          fields: { Film: 'title' },
          page: { number: '1', size: '15' },
          sort: '-rating',
          timezone: 'Europe/Paris',
        };

        const result = await new ResourcesGetter(FilmModel, options, parameters, user).perform();

        expect(result[0]).toHaveLength(3);
        expect(result[0][0].title).toBe('Terminator');
        expect(result[0][1].title).toBe('Titanic');
      });
    });
  });
});
