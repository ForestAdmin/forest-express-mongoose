import mongoose, { ValidationError } from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesCreator from '../../../src/services/resource-creator';
import mongooseConnect from '../../utils/mongoose-connect';

describe('service > resources-creator', () => {
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
    expect(result.id).not.toBe('56cb91bdc3464f14678934ca');
  });
});
