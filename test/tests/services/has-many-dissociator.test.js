import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import mongooseConnect from '../../utils/mongoose-connect';
import HasManyDissociator from '../../../src/services/has-many-dissociator';

describe('service > has-many-dissociator', () => {
  describe('when the association name is not flattened', () => {
    let TreeModel;
    let LumberJackModel;

    beforeAll(async () => {
      Interface.Schemas = {
        schemas: {
          LumberJack: {
            name: 'LumberJack',
            fields: [
              {
                field: '_id',
                type: 'ObjectId',
              },
              {
                field: 'name',
                type: 'String',
              },
            ],
          },
          Tree: {
            name: 'Tree',
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
    });

    beforeEach(async () => {
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
        ]),
        loadFixture(TreeModel, [
          {
            _id: '41224d776a326fb40f000003',
            name: 'Ashe Tree Lane',
            owners: ['41224d776a326fb40f000001', '41224d776a326fb40f000002'],
          },
        ]),
      ]);
    });

    afterAll(() => mongoose.connection.close());

    it('should delete the document and the association with option delete=true', async () => {
      expect.assertions(3);
      await new HasManyDissociator(
        TreeModel,
        LumberJackModel,
        {},
        { delete: true, associationName: 'owners', recordId: '41224d776a326fb40f000003' },
        { data: [{ id: '41224d776a326fb40f000002' }] },
      ).perform();
      const lumberJackDocumentsCount = await LumberJackModel.countDocuments();
      const treeDocuments = await TreeModel.find({});
      expect(lumberJackDocumentsCount).toStrictEqual(1);
      expect(treeDocuments).toHaveLength(1);
      expect(treeDocuments[0].owners).toHaveLength(1);
    });

    it('should delete the association but not the document with delete=false', async () => {
      expect.assertions(3);
      await new HasManyDissociator(
        TreeModel,
        LumberJackModel,
        {},
        { delete: false, associationName: 'owners', recordId: '41224d776a326fb40f000003' },
        { data: [{ id: '41224d776a326fb40f000001' }] },
      ).perform();
      const lumberJackDocumentsCount = await LumberJackModel.countDocuments();
      const treeDocuments = await TreeModel.find({});
      expect(lumberJackDocumentsCount).toStrictEqual(2);
      expect(treeDocuments).toHaveLength(1);
      expect(treeDocuments[0].owners).toHaveLength(1);
    });
  });

  describe('when the association name is flattened', () => {
    it('should flatten the association name before dissociating', () => {
      expect.assertions(1);

      class FakeModel {
        findByIdAndUpdate() {
          return this;
        }

        lean() {
          return this;
        }

        exec() {
          return this;
        }
      }

      const fakeModel = new FakeModel();
      const spy = jest.spyOn(fakeModel, 'findByIdAndUpdate');

      const hasManyDissociator = new HasManyDissociator(
        fakeModel,
        null,
        null,
        { associationName: 'engine@@@company', recordId: 1 },
        { data: [{ id: '1' }, { id: '2' }] },
      );

      hasManyDissociator.perform();

      expect(spy).toHaveBeenCalledWith(
        1,
        {
          $pull: {
            'engine.company': {
              $in: ['1', '2'],
            },
          },
        },
        {
          new: true,
        },
      );
    });
  });
});
