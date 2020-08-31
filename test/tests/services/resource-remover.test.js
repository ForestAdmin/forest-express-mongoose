import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourceRemover from '../../../src/services/resource-remover';
import mongooseConnect from '../../utils/mongoose-connect';

describe('service > resource-remover', () => {
  let IslandModel;

  beforeAll(() => {
    Interface.Schemas = {
      schemas: {
        Island: {
          name: 'Island',
          idField: '_id',
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String' },
            { field: 'name', type: 'String' },
          ],
        },
      },
    };

    return mongooseConnect()
      .then(() => {
        const IslandSchema = mongoose.Schema({
          name: { type: String },
        });

        IslandModel = mongoose.model('Island', IslandSchema);
        return IslandModel.deleteMany({});
      });
  });

  afterAll(() => mongoose.connection.close());

  beforeEach(async () => {
    await IslandModel.deleteMany({});
    await loadFixture(IslandModel, [
      { name: 'Kauai', _id: '56cb91bdc3464f14678934ca' },
      { name: 'Oahu', _id: '56cb91bdc3464f14678934cb' },
    ]);
  });


  it('should not remove resource with missing recordId', async () => {
    expect.assertions(1);
    await new ResourceRemover(IslandModel, {}).perform();
    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(2);
  });

  it('should remove one resource with existing ID', async () => {
    expect.assertions(1);
    await new ResourceRemover(IslandModel, { recordId: '56cb91bdc3464f14678934ca' }).perform();
    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(1);
  });

  it('should not remove resource with not existing ID', async () => {
    expect.assertions(1);
    await new ResourceRemover(IslandModel, { recordId: '56cb91bdc3464f14678934cd' }).perform();
    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(2);
  });
});
