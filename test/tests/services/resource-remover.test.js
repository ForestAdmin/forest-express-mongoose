import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourceRemover from '../../../src/services/resource-remover';
import mongooseConnect from '../../utils/mongoose-connect';

const user = { renderingId: 1 };
const baseParams = { timezone: 'Europe/Paris' };

describe('service > resource-remover', () => {
  let IslandModel;
  let scopeSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);
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

    await mongooseConnect();

    const IslandSchema = new mongoose.Schema({
      name: { type: String },
    });

    IslandModel = mongoose.model('Island', IslandSchema);
    await IslandModel.deleteMany({});
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await IslandModel.deleteMany({});
    await loadFixture(IslandModel, [
      { name: 'Kauai', _id: '56cb91bdc3464f14678934ca' },
      { name: 'Oahu', _id: '56cb91bdc3464f14678934cb' },
    ]);
  });


  it('should not remove resource with missing recordId', async () => {
    expect.assertions(1);

    await new ResourceRemover(IslandModel, baseParams, user).perform();

    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(2);
  });

  it('should remove one resource with existing ID', async () => {
    expect.assertions(1);

    const params = { ...baseParams, recordId: '56cb91bdc3464f14678934ca' };
    await new ResourceRemover(IslandModel, params, user).perform();

    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(1);
  });

  it('should not remove resource with not existing ID', async () => {
    expect.assertions(1);

    const params = { ...baseParams, recordId: '56cb91bdc3464f14678934cd' };
    await new ResourceRemover(IslandModel, params, user).perform();

    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(2);
  });
});
