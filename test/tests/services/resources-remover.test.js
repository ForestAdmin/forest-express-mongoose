import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesRemover from '../../../src/services/resources-remover';
import mongooseConnect from '../../utils/mongoose-connect';
import { InvalidParameterError } from '../../../src/services/errors';

const user = { renderingId: 1 };
const params = { timezone: 'Europe/Paris' };

describe('service > resources-remover', () => {
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

  it('should throw error if ids is empty', async () => {
    expect.assertions(1);

    const remover = new ResourcesRemover(null, params, [], user);
    await expect(remover.perform()).rejects.toThrow(InvalidParameterError);
  });

  it('should throw error if ids is a string', async () => {
    expect.assertions(1);

    const remover = new ResourcesRemover(null, params, 'foo', user);
    await expect(remover.perform()).rejects.toThrow(InvalidParameterError);
  });

  it('should throw error if ids is an object', async () => {
    expect.assertions(1);

    const remover = new ResourcesRemover(null, params, {}, user);
    await expect(remover.perform()).rejects.toThrow(InvalidParameterError);
  });

  it('should remove one resource with existing ID', async () => {
    expect.assertions(1);

    const ids = ['56cb91bdc3464f14678934ca'];
    await new ResourcesRemover(IslandModel, params, ids, user).perform();
    const documentsCount = await IslandModel.countDocuments();

    expect(documentsCount).toStrictEqual(1);
  });

  it('should remove all resources with existing ID', async () => {
    expect.assertions(1);

    const ids = ['56cb91bdc3464f14678934ca', '56cb91bdc3464f14678934cb'];
    await new ResourcesRemover(IslandModel, params, ids, user).perform();
    const documentsCount = await IslandModel.countDocuments();

    expect(documentsCount).toStrictEqual(0);
  });

  it('should not remove resource with not existing ID', async () => {
    expect.assertions(1);

    const ids = ['56cb91bdc3464f14678934cd'];
    await new ResourcesRemover(IslandModel, params, ids, user).perform();
    const documentsCount = await IslandModel.countDocuments();

    expect(documentsCount).toStrictEqual(2);
  });
});
