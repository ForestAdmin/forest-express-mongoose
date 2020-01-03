import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesGetter from '../../../src/services/resources-getter';
import mongooseConnect from '../../utils/mongoose-connect';

describe('service > resources-getter', () => {
  let OrderModel;
  let UserModel;
  let FilmModel;

  const options = {
    mongoose,
    connections: [mongoose],
  };

  beforeAll(() => {
    Interface.Schemas = {
      schemas: {
        Order: {
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
          ],
        },
      },
    };

    return mongooseConnect()
      .then(() => {
        const OrderSchema = mongoose.Schema({
          amount: { type: Number },
          comment: { type: String },
          giftMessage: { type: String },
          orderer: { type: 'ObjectId' },
          receiver: { type: 'ObjectId' },
        });
        const UserSchema = mongoose.Schema({
          _id: { type: 'ObjectId' },
          name: { type: String },
          age: { type: Number },
        });
        const FilmSchema = mongoose.Schema({
          _id: { type: 'ObjectId' },
          title: { type: String },
          duration: { type: Number },
        });

        OrderModel = mongoose.model('Order', OrderSchema);
        UserModel = mongoose.model('User', UserSchema);
        FilmModel = mongoose.model('Film', FilmSchema);

        return Promise.all([OrderModel.remove({}), UserModel.remove({}), FilmModel.remove({})]);
      })
      .then(() =>
        Promise.all([
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
            },
            {
              _id: '41224d776a326fb40f000012',
              duration: 360,
              title: 'Titanic',
            },
            {
              _id: '41224d776a326fb40f000013',
              duration: 125,
              title: 'Matrix',
            },
          ]),
        ]));
  });

  afterAll(() => mongoose.connection.close());

  describe('with a search on a collection with searchFields', () => {
    it('should retrieve the record with `gift` value in `comment` field', async () => {
      expect.assertions(2);
      const parameters = {
        fields: {
          order: '_id,amount,description,giftMessage',
        },
        page: { number: '1', size: '30' },
        search: 'gift',
        timezone: 'Europe/Paris',
      };

      const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].comment).toMatch(/gift/);
    });

    it('should retrieve the count of the records', async () => {
      expect.assertions(1);
      const parameters = {
        search: 'gift',
        timezone: 'Europe/Paris',
      };

      const count = await new ResourcesGetter(OrderModel, options, parameters).count();
      expect(count).toStrictEqual(1);
    });
  });

  describe('with a basic flat filter', () => {
    it('should filter correctly', async () => {
      expect.assertions(2);
      const parameters = {
        fields: {
          order: '_id,amount,description,giftMessage',
        },
        page: { number: '1', size: '30' },
        filters: JSON.stringify({ field: 'giftMessage', operator: 'starts_with', value: 'Here' }),
        timezone: 'Europe/Paris',
      };

      const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].comment).toMatch(/comment/);
    });
  });

  describe('with basic \'and\' aggregator', () => {
    it('should filter correctly', async () => {
      expect.assertions(2);
      const parameters = {
        fields: {
          order: '_id,amount,description,giftMessage',
        },
        page: { number: '1', size: '30' },
        filters: JSON.stringify({
          aggregator: 'and',
          conditions: [
            { field: 'giftMessage', operator: 'contains', value: 'you' },
            { field: 'amount', operator: 'greater_than', value: '1000' },
          ],
        }),
        timezone: 'Europe/Paris',
      };

      const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
      expect(result[0]).toHaveLength(1);
      expect(result[0][0].comment).toMatch(/gift/);
    });

    describe('with belongsTo filter', () => {
      describe('with flat condition', () => {
        it('should filter correctly', async () => {
          expect.assertions(2);
          const parameters = {
            fields: {
              order: '_id,amount,description,giftMessage',
            },
            page: { number: '1', size: '30' },
            filters: JSON.stringify({ field: 'orderer:name', operator: 'contains', value: 'Cohle' }),
            timezone: 'Europe/Paris',
          };


          const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
          expect(result[0]).toHaveLength(1);
          expect(result[0][0].comment).toMatch(/gift/);
        });
      });

      describe('with \'and\' aggregator on two belongsTo on the same model', () => {
        it('should filter correctly', async () => {
          expect.assertions(1);
          const parameters = {
            fields: {
              order: '_id,amount,description,giftMessage',
            },
            page: { number: '1', size: '30' },
            filters: JSON.stringify({
              aggregator: 'and',
              conditions: [
                { field: 'orderer:name', operator: 'contains', value: 'Cohle' },
                { field: 'orderer:name', operator: 'ends_with', value: 'Gardner' },
              ],
            }),
            timezone: 'Europe/Paris',
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
          expect(result[0]).toHaveLength(0);
        });
      });

      describe('with \'or\' aggregator on two belongsTo on the same model', () => {
        it('should filter correctly', async () => {
          expect.assertions(1);
          const parameters = {
            fields: {
              order: '_id,amount,description,giftMessage',
            },
            page: { number: '1', size: '30' },
            filters: JSON.stringify({
              aggregator: 'or',
              conditions: [
                { field: 'orderer:name', operator: 'contains', value: 'Cohle' },
                { field: 'receiver:name', operator: 'ends_with', value: 'Gardner' },
              ],
            }),
            timezone: 'Europe/Paris',
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
          expect(result[0]).toHaveLength(2);
        });
      });

      describe('with complex nested filters', () => {
        it('should filter correctly', async () => {
          expect.assertions(1);
          const parameters = {
            fields: {
              order: '_id,amount,description,giftMessage',
            },
            page: { number: '1', size: '30' },
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
            timezone: 'Europe/Paris',
          };

          const result = await new ResourcesGetter(OrderModel, options, parameters).perform();
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
          fields: { films: 'description' },
          page: { number: '1', size: '15' },
          searchExtended: '0',
          timezone: 'Europe/Paris',
        };

        const [result] = await new ResourcesGetter(FilmModel, options, parameters).perform();
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
          fields: { films: 'title' },
          page: { number: '1', size: '15' },
          searchExtended: '0',
          timezone: 'Europe/Paris',
        };

        const [result] = await new ResourcesGetter(FilmModel, options, parameters).perform();
        expect(result).toHaveLength(3);
        const titles = result.filter((film) => !!film.title);
        expect(titles).toHaveLength(3);
        const durations = result.filter((film) => !!film.duration);
        expect(durations).toHaveLength(0);
      });
    });
  });
});
