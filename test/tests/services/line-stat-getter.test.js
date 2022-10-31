import Interface from 'forest-express';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import LineStatGetter from '../../../src/services/line-stat-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const user = { renderingId: 1 };
const options = { Mongoose: mongoose, connections: { mongoose } };
const baseParams = {
  aggregator: 'Sum',
  aggregateFieldName: 'rating',
  groupByFieldName: 'createdAt',
  timeRange: 'Month',
  timezone: 'Europe/Paris',
};

describe('service > line-stat-getter', () => {
  let ReviewModel;
  let scopeSpy;
  let dateNowSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);

    dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date(Date.UTC(2017, 1, 14)).valueOf());

    Interface.Schemas = {
      schemas: {
        ReviewsLine: {
          name: 'ReviewsLine',
          idField: '_id',
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'createdAt', type: 'Date' },
            { field: 'rating', type: 'Number' },
            { field: 'color', type: 'String' },
          ],
        },
      },
    };

    await mongooseConnect();

    ReviewModel = mongoose.model('ReviewsLine', new mongoose.Schema({
      createdAt: { type: Date },
      rating: { type: Number },
      color: { type: String },
    }));
  });

  afterAll(async () => {
    dateNowSpy.mockRestore();
    scopeSpy.mockRestore();

    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
  });

  describe('failures', () => {
    it('should work when there are no records', async () => {
      expect.assertions(1);

      const params = baseParams;
      const getter = new LineStatGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({ value: [] });
    });
  });

  describe('different aggregation', () => {
    it('should work aggregating by day', async () => {
      expect.assertions(1);

      await loadFixture(ReviewModel, [
        { rating: 10, createdAt: new Date('2016-11-10') },
        { rating: 10, createdAt: new Date('2016-11-11') },
        { rating: 15, createdAt: new Date('2016-11-13') },
      ]);

      const params = { ...baseParams, timeRange: 'Day' };
      const getter = new LineStatGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({
        value: [
          { label: '10/11/2016', values: { value: 10 } },
          { label: '11/11/2016', values: { value: 10 } },
          { label: '12/11/2016', values: { value: 0 } },
          { label: '13/11/2016', values: { value: 15 } },
        ],
      });
    });

    it('should work aggregating by week', async () => {
      expect.assertions(1);

      await loadFixture(ReviewModel, [
        { rating: 10, createdAt: new Date('2016-11-10') },
        { rating: 10, createdAt: new Date('2016-11-14') },
        { rating: 15, createdAt: new Date('2016-11-17') },
      ]);

      const params = { ...baseParams, timeRange: 'Week' };
      const getter = new LineStatGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({
        value: [
          { label: 'W45-2016', values: { value: 10 } },
          { label: 'W46-2016', values: { value: 25 } },
        ],
      });
    });

    it('should work aggregating by month', async () => {
      expect.assertions(1);

      await loadFixture(ReviewModel, [
        { rating: 10, createdAt: new Date('2016-11-10') },
        { rating: 10, createdAt: new Date('2016-11-14') },
        { rating: 15, createdAt: new Date('2017-01-01') },
      ]);

      const params = { ...baseParams, timeRange: 'Month' };
      const getter = new LineStatGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({
        value: [
          { label: 'Nov 16', values: { value: 20 } },
          { label: 'Dec 16', values: { value: 0 } },
          { label: 'Jan 17', values: { value: 15 } },
        ],
      });
    });

    it('should work aggregating by year', async () => {
      expect.assertions(1);

      await loadFixture(ReviewModel, [
        { rating: 10, createdAt: new Date('2016-11-10') },
        { rating: 10, createdAt: new Date('2016-11-14') },
        { rating: 15, createdAt: new Date('2017-01-01') },
      ]);

      const params = { ...baseParams, timeRange: 'Year' };
      const getter = new LineStatGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({
        value: [
          { label: '2016', values: { value: 20 } },
          { label: '2017', values: { value: 15 } },
        ],
      });
    });
  });
});
