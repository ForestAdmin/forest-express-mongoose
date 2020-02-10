import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesRemover from '../../../src/services/resources-remover';
import mongooseConnect from '../../utils/mongoose-connect';
import { InvalidParameterError } from '../../../src/services/errors';

describe('service > resources-remover', () => {
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
        return IslandModel.remove({});
      });
  });

  afterAll(() => mongoose.connection.close());

  beforeEach(async () => {
    await IslandModel.remove({});
    await loadFixture(IslandModel, [
      { name: 'Kauai', _id: '56cb91bdc3464f14678934ca' },
      { name: 'Oahu', _id: '56cb91bdc3464f14678934cb' },
    ]);
  });


  it('should throw error if ids is not an array or empty', () => {
    expect.assertions(3);
    expect(() => new ResourcesRemover(null, []).perform()).toThrow(InvalidParameterError);
    expect(() => new ResourcesRemover(null, 'foo').perform()).toThrow(InvalidParameterError);
    expect(() => new ResourcesRemover(null, {}).perform()).toThrow(InvalidParameterError);
  });

  it('should remove one resource with existing ID', async () => {
    expect.assertions(1);
    await new ResourcesRemover(IslandModel, ['56cb91bdc3464f14678934ca']).perform();
    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(1);
  });

  it('should remove all resources with existing ID', async () => {
    expect.assertions(1);
    await new ResourcesRemover(IslandModel, ['56cb91bdc3464f14678934ca', '56cb91bdc3464f14678934cb']).perform();
    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(0);
  });

  it('should not remove resource with not existing ID', async () => {
    expect.assertions(1);
    await new ResourcesRemover(IslandModel, ['56cb91bdc3464f14678934cd']).perform();
    const documentsCount = await IslandModel.countDocuments();
    expect(documentsCount).toStrictEqual(2);
  });
});
