
import Interface from 'forest-express';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import ValueStatGetter from '../../../src/services/value-stat-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const user = { renderingId: 1 };
const options = { Mongoose: mongoose, connections: { mongoose } };
const baseParams = { timezone: 'Europe/Paris' };

describe('service > value-stat-getter', () => {
  let ReviewModel;
  let scopeSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);

    Interface.Schemas = {
      schemas: {
        ReviewsValue: {
          name: 'ReviewsValue',
          idField: '_id',
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'rating', type: 'Number' },
          ],
        },
      },
    };

    await mongooseConnect();

    ReviewModel = mongoose.model('ReviewsValue', new mongoose.Schema({
      rating: { type: Number },
    }));
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
  });

  it('should perform a count when their are no records', async () => {
    expect.assertions(1);

    const params = baseParams;
    const getter = new ValueStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({ value: { countCurrent: 0 } });
  });

  it('should perform a count', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [{ rating: 0 }]);

    const params = baseParams;
    const getter = new ValueStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({ value: { countCurrent: 1 } });
  });

  it('should perform a sum', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [{ rating: 10 }]);

    const params = { ...baseParams, aggregateFieldName: 'rating' };
    const getter = new ValueStatGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({ value: { countCurrent: 10 } });
  });

  describe('with a filter', () => {
    it('should filter the result', async () => {
      expect.assertions(1);

      await loadFixture(ReviewModel, [{ rating: 10 }, { rating: 11 }]);

      const params = { ...baseParams, filter: { aggregator: 'and', conditions: [{ field: 'rating', operator: 'equal', value: 10 }] } };
      const getter = new ValueStatGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({ value: { countCurrent: 1 } });
    });
  });
});
