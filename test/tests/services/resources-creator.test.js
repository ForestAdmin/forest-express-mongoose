import mongoose, { ValidationError } from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesCreator from '../../../src/services/resource-creator';
import mongooseConnect from '../../utils/mongoose-connect';

describe('service > resources-creator', () => {
  describe('> with auto-generated ids', () => {
    let IslandModel;

    beforeAll(() => {
      Interface.Schemas = {
        schemas: {
          Island: {
            name: 'Island',
            idField: '_id',
            searchFields: ['name'],
            fields: [
              { field: '_id', type: 'String', isGenerated: true },
              { field: 'name', type: 'String', isGenerated: false },
              { field: 'population', type: 'Number', isGenerated: false },
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

  describe('> with non-auto-generated ids', () => {
    let model;

    beforeAll(async () => {
      await mongooseConnect();

      Interface.Schemas = {
        schemas: {
          Location: {
            name: 'Location',
            idField: '_id',
            searchFields: ['name'],
            fields: [
              { field: '_id', type: 'String', isGenerated: false },
              { field: 'name', type: 'String', isGenerated: false },
            ],
          },
        },
      };

      const schema = mongoose.Schema({
        _id: {
          type: String,
        },
        name: {
          type: String,
        },
      });

      model = mongoose.model('Location', schema);
    });

    afterEach(async () => {
      await model.deleteMany({});
    });

    afterAll(async () => {
      await mongoose.connection.close();
    });

    it('should keep the _id field when creating a document', async () => {
      expect.assertions(2);
      const result = await new ResourcesCreator(model, { _id: 'haiti-id', name: 'Haiti' })
        .perform();
      expect(result).toHaveProperty('name', 'Haiti');
      expect(result._id).toBe('haiti-id');
    });

    it('should throw an exception if the same id is inserted twice', async () => {
      expect.assertions(1);
      await model.create({ _id: 'the-id', name: 'some place' });

      await expect(
        new ResourcesCreator(
          model,
          { _id: 'the-id', name: 'another place' },
        ).perform(),
      ).rejects.toThrow(/^E11000 duplicate key error collection/);
    });
  });
});
