
import Interface from 'forest-express';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import ResourceGetter from '../../../src/services/resource-getter';
import mongooseConnect from '../../utils/mongoose-connect';

const options = { Mongoose: mongoose, connections: { mongoose } };

describe('service > resource-getter', () => {
  let ReviewModel;

  beforeAll(async () => {
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

  afterAll(() => mongoose.connection.close());

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
  });

  it('should reject when the record does not exists', async () => {
    expect.assertions(1);

    const params = { recordId: '507f1f77bcf86cd799439011' };
    const getter = new ResourceGetter(ReviewModel, params, options);
    await expect(getter.perform()).toReject();
  });

  it('should return the record when it exists', async () => {
    expect.assertions(1);

    await loadFixture(ReviewModel, [
      { _id: '507f1f77bcf86cd799439011', rating: 0 },
    ]);

    const params = { recordId: '507f1f77bcf86cd799439011' };
    const getter = new ResourceGetter(ReviewModel, params, options);
    expect(await getter.perform()).toStrictEqual({
      __v: 0, // mongoose version
      _id: mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      rating: 0,
    });
  });
});
