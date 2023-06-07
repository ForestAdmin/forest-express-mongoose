
import Interface from 'forest-express';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import ResourceGetter from '../../../src/services/resource-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const user = { renderingId: 1 };
const baseParams = { timezone: 'Europe/Paris' };
const options = { Mongoose: mongoose, connections: { mongoose } };

describe('service > resource-getter', () => {
  let ReviewModel;
  let scopeSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);
    Interface.Schemas = {
      schemas: {
        ReviewsRGet: {
          name: 'ReviewsRGet',
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

    ReviewModel = mongoose.model('ReviewsRGet', new mongoose.Schema({
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

  it('should reject when the record does not exists', async () => {
    expect.assertions(1);

    const params = { ...baseParams, recordId: '507f1f77bcf86cd799439011' };
    const getter = new ResourceGetter(ReviewModel, params, options, user);
    await expect(getter.perform()).toReject();
  });

  it('should return the record when it exists', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { _id: '507f1f77bcf86cd799439011', rating: 0 },
    ]);

    const params = { ...baseParams, recordId: '507f1f77bcf86cd799439011' };
    const getter = new ResourceGetter(ReviewModel, params, options, user);
    expect(await getter.perform()).toStrictEqual({
      __v: 0, // mongoose version
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      rating: 0,
    });
  });
});
