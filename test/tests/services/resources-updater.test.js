import mongoose, { ValidationError, CastError } from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesUpdater from '../../../src/services/resource-updater';
import mongooseConnect from '../../utils/mongoose-connect';
import Flattener from '../../../src/services/flattener';

const user = { renderingId: 1 };
const params = { timezone: 'Europe/Paris' };

describe('service > resources-updater', () => {
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
            { field: 'population', type: 'Number' },
          ],
        },
      },
    };

    await mongooseConnect();

    const IslandSchema = new mongoose.Schema({
      name: {
        type: String,
        validate: {
          validator: (v) => ['Kauai', 'Oahu', 'Haiti'].includes(v),
          message: (props) => `${props.value} is not valid`,
        },
      },
      population: {
        type: Number,
      },
    });

    IslandModel = mongoose.model('Island', IslandSchema);
    IslandModel.deleteMany({});
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await IslandModel.deleteMany({});
    await loadFixture(IslandModel, [
      { name: 'Kauai', population: 3, _id: '56cb91bdc3464f14678934ca' },
      { name: 'Oahu', population: 4, _id: '56cb91bdc3464f14678934cb' },
    ]);
  });

  it('should reject with validation error', async () => {
    expect.assertions(1);

    const island = IslandModel({ _id: '56cb91bdc3464f14678934ca', name: 'Foo' });
    const updater = new ResourcesUpdater(IslandModel, params, island, user);

    await expect(updater.perform()).rejects.toThrow(ValidationError);
  });

  it('should reject with cast validation error', async () => {
    expect.assertions(1);

    const island = { _id: '56cb91bdc3464f14678934ca', population: 'foo' };
    const updater = new ResourcesUpdater(IslandModel, params, island, user);

    await expect(updater.perform()).rejects.toThrow(CastError);
  });

  it('should resolve with updated object', async () => {
    expect.assertions(1);

    const island = IslandModel({ _id: '56cb91bdc3464f14678934ca', name: 'Haiti' });
    const updater = new ResourcesUpdater(IslandModel, params, island, user);

    expect(await updater.perform()).toHaveProperty('name', 'Haiti');
  });

  it('should try to flatten the data', async () => {
    expect.assertions(4);

    const island = IslandModel({ _id: '56cb91bdc3464f14678934ca', name: 'Haiti' });
    const updater = new ResourcesUpdater(IslandModel, params, island, user);

    const spyFieldNameGetter = jest.spyOn(Flattener, 'getFlattenedFieldsName');
    const spyFlattener = jest.spyOn(Flattener, 'flattenRecordDataForUpdates');

    await updater.perform();

    expect(spyFieldNameGetter).toHaveBeenCalledTimes(1);
    expect(spyFieldNameGetter).toHaveBeenCalledWith([
      { field: '_id', type: 'String' },
      { field: 'name', type: 'String' },
      { field: 'population', type: 'Number' },
    ]);
    expect(spyFlattener).toHaveBeenCalledTimes(1);
    expect(spyFlattener).toHaveBeenCalledWith(island, null, []);
  });
});
