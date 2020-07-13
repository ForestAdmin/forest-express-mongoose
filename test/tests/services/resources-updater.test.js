import mongoose, { ValidationError, CastError } from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesUpdater from '../../../src/services/resource-updater';
import mongooseConnect from '../../utils/mongoose-connect';

describe('service > resources-updater', () => {
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
            { field: 'population', type: 'Number' },
          ],
        },
      },
    };

    return mongooseConnect()
      .then(() => {
        const IslandSchema = mongoose.Schema({
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
        return IslandModel.deleteMany({});
      });
  });

  afterAll(() => mongoose.connection.close());

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
    await expect(new ResourcesUpdater(IslandModel, '56cb91bdc3464f14678934ca', island)
      .perform()).rejects.toThrow(ValidationError);
  });

  it('should resolve with updated object', async () => {
    expect.assertions(1);
    const island = IslandModel({ _id: '56cb91bdc3464f14678934ca', name: 'Haiti' });
    await expect(await new ResourcesUpdater(IslandModel, '56cb91bdc3464f14678934ca', island)
      .perform()).toHaveProperty('name', 'Haiti');
  });

  it('should reject with cast validation error', async () => {
    expect.assertions(1);
    const island = { _id: '56cb91bdc3464f14678934ca', population: 'foo' };
    await expect(new ResourcesUpdater(IslandModel, '56cb91bdc3464f14678934ca', island)
      .perform()).rejects.toThrow(CastError);
  });
});
