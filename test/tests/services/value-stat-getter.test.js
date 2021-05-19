
import Interface from 'forest-express';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import ValueStatGetter from '../../../src/services/value-stat-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const options = { Mongoose: mongoose, connections: { mongoose } };

describe('service > resources-updater', () => {
  let ReviewModel;

  beforeAll(async () => {
    Interface.Schemas = {
      schemas: {
        Reviews: {
          name: 'Reviews',
          idField: '_id',
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'rating', type: 'Number' },
          ],
        },
      },
    };

    mongooseConnect();

    const ReviewSchema = new mongoose.Schema({
      rating: {
        type: Number,
      },
    });

    ReviewModel = mongoose.model('Reviews', ReviewSchema);
  });

  afterAll(() => mongoose.connection.close());

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
  });

  it('should perform a count when their are no records', async () => {
    expect.assertions(1);

    const params = { timezone: 'Europe/Paris' };
    const getter = new ValueStatGetter(ReviewModel, params, options);
    expect(await getter.perform()).toStrictEqual({ value: 0 });
  });

  it('should perform a count', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { rating: 0, _id: '56cb91bdc3464f14678934cb' },
    ]);

    const params = { timezone: 'Europe/Paris' };
    const getter = new ValueStatGetter(ReviewModel, params, options);
    expect(await getter.perform()).toStrictEqual({ value: 1 });
  });

  it('should perform a sum', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { rating: 10, _id: '56cb91bdc3464f14678934cb' },
    ]);

    const params = { timezone: 'Europe/Paris', aggregate_field: 'rating' };
    const getter = new ValueStatGetter(ReviewModel, params, options);
    expect(await getter.perform()).toStrictEqual({ value: 10 });
  });
});
