import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import mongooseConnect from '../../utils/mongoose-connect';
import HasManyGetter from '../../../src/services/has-many-getter';

const user = { renderingId: 1 };
const options = {
  Mongoose: mongoose,
  connections: { mongoose },
};
const parameters = {
  fields: {
    order: '_id,name,country',
  },
  recordId: '41224d776a326fb40f000003',
  associationName: 'owners',
  timezone: 'Europe/Paris',
};

describe('service > has-many-getter', () => {
  let TreeModel;
  let LumberJackModel;
  let scopeSpy;

  beforeAll(async () => {
    scopeSpy = jest.spyOn(Interface.scopeManager, 'getScopeForUser').mockReturnValue(null);

    Interface.Schemas = {
      schemas: {
        LumberJack: {
          name: 'LumberJack',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          searchFields: ['name', 'country'],
          fields: [
            {
              field: '_id',
              type: 'ObjectId',
            },
            {
              field: 'name',
              type: 'String',
            },

            {
              field: 'country',
              type: 'String',
            },
          ],
        },
        Tree: {
          name: 'Tree',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'ObjectId' },
            { field: 'name', type: 'String' },
            {
              field: 'owners',
              type: ['ObjectId'],
              reference: 'LumberJack._id',
            },
          ],
        },
      },
    };

    await mongooseConnect();

    const LumberJackSchema = new mongoose.Schema({
      _id: { type: 'ObjectId' },
      name: { type: String },
      country: { type: String },
    });
    const TreeSchema = new mongoose.Schema({
      id: { type: 'ObjectId' },
      name: { type: String },
      owners: {
        type: ['ObjectId'],
        ref: 'LumberJack',
      },
    });

    LumberJackModel = mongoose.model('LumberJack', LumberJackSchema);
    TreeModel = mongoose.model('Tree', TreeSchema);
    await Promise.all([LumberJackModel.deleteMany({}), TreeModel.deleteMany({})]);

    await Promise.all([
      loadFixture(LumberJackModel, [
        {
          _id: '41224d776a326fb40f000001',
          name: 'Kaladin',
          country: 'CZ',
        },
        {
          _id: '41224d776a326fb40f000002',
          name: 'Marcell Doe',
          country: 'US',
        },
        {
          _id: '41224d776a326fb40f000004',
          name: 'Marc Schneider',
          country: 'DE',
        },
        {
          _id: '41224d776a326fb40f000005',
          name: 'Maria Smith',
          country: 'US',
        },
      ]),
      loadFixture(TreeModel, [
        {
          _id: '41224d776a326fb40f000003',
          name: 'Ashe Tree Lane',
          owners: [
            '41224d776a326fb40f000001',
            '41224d776a326fb40f000002',
            '41224d776a326fb40f000004',
            '41224d776a326fb40f000005',
          ],
        },
      ]),
    ]);
  });

  afterAll(async () => {
    scopeSpy.mockRestore();
    await mongoose.connection.close();
  });

  it('should retrieve all the related records when there is no filters or search', async () => {
    expect.assertions(2);

    const hasManyGetter = new HasManyGetter(
      TreeModel,
      LumberJackModel,
      options,
      parameters,
      user,
    );

    const result = await hasManyGetter.perform();
    const count = await hasManyGetter.count();


    expect(result[0]).toHaveLength(4);
    expect(count).toBe(4);
  });

  it('should retrieve matching records and count when search is specified', async () => {
    expect.assertions(3);

    const hasManyGetter = new HasManyGetter(
      TreeModel,
      LumberJackModel,
      options,
      {
        ...parameters,
        search: 'maria',
      },
      user,
    );

    const result = await hasManyGetter.perform();
    const count = await hasManyGetter.count();

    expect(result[0]).toHaveLength(1);
    expect(result[0][0].name).toBe('Maria Smith');
    expect(count).toBe(1);
  });

  it('should retrieve matching records and count when filter is specified', async () => {
    expect.assertions(4);

    const hasManyGetter = new HasManyGetter(
      TreeModel,
      LumberJackModel,
      options,
      {
        ...parameters,
        filters: JSON.stringify({ field: 'name', operator: 'starts_with', value: 'Marc' }),
      },
      user,
    );

    const result = await hasManyGetter.perform();
    const count = await hasManyGetter.count();

    expect(result[0]).toHaveLength(2);
    expect(result[0][0].name).toBe('Marcell Doe');
    expect(result[0][1].name).toBe('Marc Schneider');
    expect(count).toBe(2);
  });

  it('should retrieve matching records and count with filter with aggregator', async () => {
    expect.assertions(6);

    const hasManyGetter = new HasManyGetter(
      TreeModel,
      LumberJackModel,
      options,
      {
        ...parameters,
        filters: JSON.stringify({
          aggregator: 'and',
          conditions: [
            { field: 'country', operator: 'equal', value: 'US' },
            { field: 'name', operator: 'starts_with', value: 'Mar' },
          ],
        }),
      },
      user,
    );

    const result = await hasManyGetter.perform();
    const count = await hasManyGetter.count();

    expect(result[0]).toHaveLength(2);
    expect(result[0][0].name).toBe('Marcell Doe');
    expect(result[0][1].name).toBe('Maria Smith');
    expect(result[0][0].country).toBe('US');
    expect(result[0][1].country).toBe('US');
    expect(count).toBe(2);
  });

  it('should retrieve matching records and count when filter and search are specified', async () => {
    expect.assertions(6);

    const hasManyGetter = new HasManyGetter(
      TreeModel,
      LumberJackModel,
      options,
      {
        ...parameters,
        search: 'mar',
        filters: JSON.stringify({ field: 'country', operator: 'equal', value: 'US' }),
      },
      user,
    );

    const result = await hasManyGetter.perform();
    const count = await hasManyGetter.count();

    expect(result[0]).toHaveLength(2);
    expect(result[0][0].name).toBe('Marcell Doe');
    expect(result[0][1].name).toBe('Maria Smith');
    expect(result[0][0].country).toBe('US');
    expect(result[0][1].country).toBe('US');
    expect(count).toBe(2);
  });
});
