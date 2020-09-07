import mongoose, { ValidationError } from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesCreator from '../../../src/services/resource-creator';
import mongooseConnect from '../../utils/mongoose-connect';

describe('service > resources-creator', () => {
  let IslandModel;
  let CityModel;

  beforeAll(async () => {
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
        City: {
          name: 'City',
          idField: '_id',
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'String', isRequired: true },
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
    await IslandModel.deleteMany({});

    const CitySchema = new mongoose.Schema({
      _id: {
        type: String,
      },
      name: {
        type: String,
      },
      population: {
        type: Number,
      },
    });

    CityModel = mongoose.model('City', CitySchema);
    await CityModel.deleteMany({});
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
    await expect(new ResourcesCreator(IslandModel, { name: 'Wrong name' })
      .perform()).rejects.toThrow(ValidationError);
  });

  it('should resolve with updated object', async () => {
    expect.assertions(1);
    await expect(await new ResourcesCreator(IslandModel, { name: 'Haiti' })
      .perform()).toHaveProperty('name', 'Haiti');
  });

  it('should ignore _id with updated object', async () => {
    expect.assertions(2);
    const result = await new ResourcesCreator(IslandModel, { _id: '56cb91bdc3464f14678934ca', name: 'Haiti' })
      .perform();
    expect(result).toHaveProperty('name', 'Haiti');
    expect(result._id).not.toBe('56cb91bdc3464f14678934ca');
  });

  it('should not ignore _id for non-generated ids', async () => {
    expect.assertions(2);
    const result = await new ResourcesCreator(CityModel, { _id: '56cb91bdc3464f14678934ca', name: 'Lyon' })
      .perform();
    expect(result).toHaveProperty('name', 'Lyon');
    expect(result._id).toBe('56cb91bdc3464f14678934ca');
  });
});
