import { expect } from 'chai';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import mongooseConnect from '../../utils/mongoose-connect';
import QueryBuilder from '../../../src/services/query-builder';

describe('Service > QueryBuilder', () => {
  let TreeModel;
  let LumberJackModel;

  const options = {
    mongoose,
    connections: [mongoose],
  };

  before(() => {
    Interface.Schemas = {
      schemas: {
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

    return mongooseConnect()
      .then(() => {
        const LumberJackSchema = mongoose.Schema({
          _id: { type: 'ObjectId' },
          name: { type: String },
        });
        const TreeSchema = mongoose.Schema({
          id: { type: Number },
          age: { type: String },
          owner: { type: 'ObjectId' },
        });

        LumberJackModel = mongoose.model('LumberJack', LumberJackSchema);
        TreeModel = mongoose.model('Tree', TreeSchema);

        return Promise.all([LumberJackModel.remove({}), TreeModel.remove({})]);
      })
      .then(() => {
        return Promise.all([
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
  });

  after((done) => {
    mongoose.connection.close();
    done();
  });

  describe('addJoinToQuery function', () => {
    context('on correct inputs', () => {
      it('should format correctly', () => {
        const queryBuilder = new QueryBuilder(TreeModel, {}, options);
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
        expect(joins).to.deep.include(expectedJoin);
      });
    });

    context('on integration field', () => {
      it('should not contains the join', () => {
        const queryBuilder = new QueryBuilder(TreeModel, {}, options);
        const field = {
          field: 'owner',
          displayName: 'owner',
          type: 'String',
          reference: 'LumberJack._id',
          integration: 'stripe',
        };
        const joins = [];
        queryBuilder.addJoinToQuery(field, joins);
        expect(joins).to.be.empty;
      });
    });
  });
});
