
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
  let UserModel;
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
            { field: 'reviewer', type: 'String', reference: 'User._id' },
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
          ],
        },
      },
    };

    await mongooseConnect();

    const UserSchema = new mongoose.Schema({
      _id: { type: 'ObjectId' },
      name: { type: String },
    });
    UserModel = mongoose.model('User', UserSchema, 'users');

    const ReviewSchema = new mongoose.Schema({
      rating: { type: Number },
      reviewer: { type: 'ObjectId', ref: 'User' },
    });
    ReviewModel = mongoose.model('ReviewsRGet', ReviewSchema);
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ReviewModel.deleteMany({});
    await UserModel.deleteMany({});
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

  describe('when fetching with referenced field', () => {
    it('should return the record properly', async () => {
      expect.assertions(1);

      await loadFixture(UserModel, [
        { _id: '64fad8058f3de3f425abc85c', name: 'Bobby' },
      ]);
      await loadFixture(ReviewModel, [
        { _id: '507f1f77bcf86cd799439011', rating: 5, reviewer: '64fad8058f3de3f425abc85c' },
      ]);

      const params = {
        ...baseParams,
        recordId: '507f1f77bcf86cd799439011',
      };
      const getter = new ResourceGetter(ReviewModel, params, options, user);
      expect(await getter.perform()).toStrictEqual({
        __v: 0, // mongoose version
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        rating: 5,
        reviewer: {
          __v: 0, // mongoose version
          _id: new mongoose.Types.ObjectId('64fad8058f3de3f425abc85c'),
          name: 'Bobby',
        },
      });
    });
  });
});
