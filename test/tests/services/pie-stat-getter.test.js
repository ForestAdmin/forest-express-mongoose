
import Interface from 'forest-express';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import PieStatGetter from '../../../src/services/pie-stat-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const user = { renderingId: 1 };
const options = { Mongoose: mongoose, connections: { mongoose } };
const baseParams = {
  aggregator: 'Count',
  groupByFieldName: 'rating',
  timezone: 'Europe/Paris',
};

describe('service > pie-stat-getter', () => {
  let ReviewModel;
  let scopeSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);

    Interface.Schemas = {
      schemas: {
        ReviewsPie: {
          name: 'ReviewsPie',
          idField: '_id',
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'rating', type: 'Number' },
            { field: 'createdAt', type: 'Date' },
          ],
        },
      },
    };

    await mongooseConnect();

    ReviewModel = mongoose.model('ReviewsPie', new mongoose.Schema({
      rating: { type: Number },
      createdAt: { type: Date },
    }));
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
  });

  it('should return an empty array when no records', async () => {
    expect.assertions(1);

    const params = { ...baseParams };
    const getter = new PieStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({ value: [] });
  });

  it('should count the records in each bucket', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { rating: 0 },
      { rating: 66 },
      { rating: 66 },
    ]);

    const params = { ...baseParams };
    const getter = new PieStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({
      value: [
        { key: 66, value: 2 },
        { key: 0, value: 1 },
      ],
    });
  });

  it('should sum ratings in each bucket', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { rating: 0 },
      { rating: 66 },
      { rating: 66 },
    ]);

    const params = { ...baseParams, aggregateFieldName: 'rating' };
    const getter = new PieStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({
      value: [
        { key: 66, value: 132 },
        { key: 0, value: 0 },
      ],
    });
  });

  it('should also work when grouping by date', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { rating: 10, createdAt: new Date('2010-01-01 00:00:00') },
      { rating: 15, createdAt: new Date('2010-01-02 00:00:00') },
    ]);

    const params = {
      ...baseParams,
      groupByFieldName: 'createdAt',
      aggregateFieldName: 'rating',
    };

    const getter = new PieStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({
      value: [
        { key: '02/01/2010 00:00:00', value: 15 },
        { key: '01/01/2010 00:00:00', value: 10 },
      ],
    });
  });
});
