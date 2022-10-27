import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import mongooseConnect from '../../utils/mongoose-connect';
import QueryBuilder from '../../../src/services/query-builder';

const FLATTEN_SEPARATOR = '@@@';

describe('service > query-builder', () => {
  let TreeModel;
  let LumberJackModel;
  let CarsModel;

  const options = {
    Mongoose: mongoose,
    connections: { mongoose },
  };

  beforeAll(async () => {
    Interface.Schemas = {
      schemas: {
        Cars: {
          name: 'Cars',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: 'engine@@@owner', type: 'String', reference: 'LumberJack._id' },
            { field: 'name', type: 'String' },
          ],
        },
        LumberJack: {
          name: 'LumberJack',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: 'id', type: 'ObjectId' },
            { field: 'name', type: 'String' },
          ],
        },
        Tree: {
          name: 'Tree',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'name', type: 'String' },
            { field: 'size', type: 'Number' },
            { field: 'isBig', type: 'Boolean' },
            { field: 'inhabitedOn', type: 'Date' },
            { field: 'owner', type: 'ObjectId', reference: 'LumberJack._id' },
          ],
        },
      },
    };

    await mongooseConnect();

    const LumberJackSchema = new mongoose.Schema({
      _id: { type: 'ObjectId' },
      name: { type: String },
    });
    const TreeSchema = new mongoose.Schema({
      id: { type: Number },
      age: { type: String },
      owner: { type: 'ObjectId' },
    });
    const CarsSchema = new mongoose.Schema({
      id: { type: Number },
      name: { type: String },
      engine: {
        owner: { type: 'ObjectId' },
      },
    });

    LumberJackModel = mongoose.model('LumberJack', LumberJackSchema);
    TreeModel = mongoose.model('Tree', TreeSchema);
    CarsModel = mongoose.model('Cars', CarsSchema);

    await Promise.all([LumberJackModel.deleteMany({}), TreeModel.deleteMany({})]);
    await Promise.all([
      loadFixture(LumberJackModel, [
        {
          _id: '41224d776a326fb40f000001',
          name: 'Kaladin',
        },
        {
          _id: '41224d776a326fb40f000002',
          name: 'Adolin Kholin',
        },
      ]), loadFixture(TreeModel, [
        {
          // id: 100,
          name: 'Ashe Tree Lane',
          age: 13,
          owner: '41224d776a326fb40f000001',
        },
        {
          // id: 101,
          name: 'Treefingers',
          age: 124,
          owner: '41224d776a326fb40f000002',
        },
      ]),
    ]);
  });

  afterAll(() => mongoose.connection.close());

  describe('addJoinToQuery function', () => {
    describe('on basic field', () => {
      it('should add the join correctly', () => {
        expect.assertions(1);
        const queryBuilder = new QueryBuilder(TreeModel, { timezone: 'Europe/Paris' }, options);
        const field = {
          field: 'owner',
          displayName: 'owner',
          type: 'String',
          reference: 'LumberJack._id',
        };
        const expectedJoin = {
          $lookup: {
            from: 'lumberjacks',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
          },
        };
        const joins = [];
        queryBuilder.addJoinToQuery(field, joins);
        expect(joins[0]).toStrictEqual(expectedJoin);
      });
    });

    describe('on virtual field', () => {
      it('the join should be ignored', () => {
        expect.assertions(1);
        const queryBuilder = new QueryBuilder(TreeModel, { timezone: 'Europe/Paris' }, options);
        const field = {
          field: 'owner',
          displayName: 'owner',
          type: 'String',
          reference: 'LumberJack._id',
          isVirtual: true,
        };
        const joins = [];
        queryBuilder.addJoinToQuery(field, joins);
        expect(joins).toHaveLength(0);
      });
    });

    describe('on a field with integration', () => {
      it('the join should be ignored', () => {
        expect.assertions(1);
        const queryBuilder = new QueryBuilder(TreeModel, { timezone: 'Europe/Paris' }, options);
        const field = {
          field: 'owner',
          displayName: 'owner',
          type: 'String',
          reference: 'LumberJack._id',
          isVirtual: false,
          integration: 'stripe',
        };
        const joins = [];
        queryBuilder.addJoinToQuery(field, joins);
        expect(joins).toHaveLength(0);
      });
    });

    describe('on flattened reference field', () => {
      it('should unflatten the field and add the join correctly', () => {
        expect.assertions(1);
        const queryBuilder = new QueryBuilder(CarsModel, {
          timezone: 'Europe/Paris',
        }, options);

        const field = {
          field: 'engine@@@owner',
          displayName: 'engine@@@owner',
          type: 'String',
          reference: 'LumberJack._id',
        };

        const expectedJoin = {
          $lookup: {
            from: 'lumberjacks',
            localField: 'engine.owner',
            foreignField: '_id',
            as: 'engine.owner',
          },
        };

        const jsonQuery = [];
        queryBuilder.addJoinToQuery(field, jsonQuery);
        expect(jsonQuery[0])
          .toStrictEqual(expectedJoin);
      });
    });
  });

  describe('addSortToQuery function', () => {
    describe('on basic field', () => {
      it('should add the sort correctly', () => {
        expect.assertions(1);
        const queryBuilder = new QueryBuilder(TreeModel, {
          timezone: 'Europe/Paris',
          sort: 'age',
        }, options);
        const expectedSort = {
          $sort: { age: 1 },
        };
        const jsonQuery = [];
        queryBuilder.addSortToQuery(jsonQuery);
        expect(jsonQuery[0])
          .toStrictEqual(expectedSort);
      });
    });
    describe('on flattened field', () => {
      it('should unflatten the field and add the sort correctly', () => {
        expect.assertions(1);
        const queryBuilder = new QueryBuilder(TreeModel, {
          timezone: 'Europe/Paris',
          sort: `-some${FLATTEN_SEPARATOR}flattened${FLATTEN_SEPARATOR}field`,
        }, options);
        const expectedSort = {
          $sort: { 'some.flattened.field': -1 },
        };
        const jsonQuery = [];
        queryBuilder.addSortToQuery(jsonQuery);
        expect(jsonQuery[0])
          .toStrictEqual(expectedSort);
      });
    });
  });
});
