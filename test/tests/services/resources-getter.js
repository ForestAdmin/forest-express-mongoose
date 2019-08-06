import { expect } from 'chai';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesGetter from '../../../src/services/resources-getter';
import mongooseConnect from '../../utils/mongoose-connect';

describe('Service > ResourcesGetter', () => {
  let OrderModel;
  let UserModel;

  const options = {
    mongoose,
    connections: [mongoose],
  };

  before(() => {
    Interface.Schemas = {
      schemas: {
        Order: {
          name: 'Order',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          searchFields: ['amount', 'comment'],
          fields: [
            { field: '_id', type: 'ObjectId' },
            { field: 'amount', type: 'Number' },
            { field: 'comment', type: 'String' },
            { field: 'giftMessage', type: 'String' },
            { field: 'orderer', type: 'ObjectId', reference: 'User._id' },
          ],
        },
        User: {
          name: 'User',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          searchFields: ['name'],
          fields: [
            { field: '_id', type: 'ObjectId' },
            { field: 'name', type: 'String' },
            { field: 'age', type: 'Number' },
          ],
        },
      },
    };

    return mongooseConnect()
      .then(() => {
        const OrderSchema = mongoose.Schema({
          amount: { type: Number },
          comment: { type: String },
          giftMessage: { type: String },
          orderer: { type: 'ObjectId' },
        });
        const UserSchema = mongoose.Schema({
          _id: { type: 'ObjectId' },
          name: { type: String },
          age: { type: Number },
        });

        OrderModel = mongoose.model('Order', OrderSchema);
        UserModel = mongoose.model('User', UserSchema);

        return OrderModel.remove({});
      })
      .then(() => {
        loadFixture(OrderModel, [
          {
            // _id: 100,
            amount: 199,
            comment: 'no comment!',
            giftMessage: 'Here is your gift',
          },
          {
            // _id: 101,
            amount: 1399,
            comment: 'this is a gift',
            giftMessage: 'Thank you',
            orderer: '41224d776a326fb40f000001',
          },
        ]);

        loadFixture(UserModel, [
          {
            _id: '41224d776a326fb40f000001',
            age: 49,
            name: 'Rust Cohle',
          },
        ]);
      });
  });

  after((done) => {
    mongoose.connection.close();
    done();
  });

  describe('with a search on a collection with searchFields', () => {
    it('should retrieve the record with `gift` value in `comment` field', (done) => {
      const parameters = {
        fields: {
          order: '_id,amount,description,giftMessage',
        },
        page: { number: '1', size: '30' },
        search: 'gift',
        timezone: '+02:00',
      };

      new ResourcesGetter(OrderModel, options, parameters)
        .perform()
        .then((result) => {
          expect(result[0].length).equal(1);
          expect(result[0][0].comment).to.match(/gift/);
          done();
        })
        .catch(done);
    });

    it('should retrieve the count of the records', (done) => {
      const parameters = {
        search: 'gift',
        timezone: '+02:00',
      };

      new ResourcesGetter(OrderModel, options, parameters)
        .count()
        .then((count) => {
          expect(count).equal(1);
          done();
        })
        .catch(done);
    });
  });

  describe('with filters', () => {
    it('should filter correctly with a basic flat filter', (done) => {
      const filters = { field: 'giftMessage', operator: 'starts_with', value: 'Here' };
      const parameters = {
        fields: {
          order: '_id,amount,description,giftMessage',
        },
        page: { number: '1', size: '30' },
        filters: JSON.stringify(filters),
        timezone: '+02:00',
      };

      new ResourcesGetter(OrderModel, options, parameters)
        .perform()
        .then((result) => {
          expect(result[0].length).equal(1);
          expect(result[0][0].comment).to.match(/comment/);
          done();
        })
        .catch(done);
    });

    it("should filter correctly with basic 'and' aggregator", (done) => {
      const filters = {
        aggregator: 'and',
        conditions: [
          { field: 'giftMessage', operator: 'contains', value: 'you' },
          { field: 'amount', operator: 'greater_than', value: 1000 },
        ],
      };
      const parameters = {
        fields: {
          order: '_id,amount,description,giftMessage',
        },
        page: { number: '1', size: '30' },
        filters: JSON.stringify(filters),
        timezone: '+02:00',
      };

      new ResourcesGetter(OrderModel, options, parameters)
        .perform()
        .then((result) => {
          expect(result[0].length).equal(1);
          expect(result[0][0].comment).to.match(/gift/);
          done();
        })
        .catch(done);
    });

    describe('should filter correctly with belongsTo filter', () => {
      it('works with flat condition', (done) => {
        const filters = { field: 'orderer:name', operator: 'contains', value: 'Cohle' };
        const parameters = {
          fields: {
            order: '_id,amount,description,giftMessage',
          },
          page: { number: '1', size: '30' },
          filters: JSON.stringify(filters),
          timezone: '+02:00',
        };

        new ResourcesGetter(OrderModel, options, parameters)
          .perform()
          .then((result) => {
            expect(result[0].length).equal(1);
            expect(result[0][0].comment).to.match(/gift/);
            done();
          })
          .catch(done);
      });
      // it('works with \'and\' aggregator', (done) => {
      //   done();
      // });
      // it('works with \'or\' aggregator', (done) => {
      //   done();
      // });
    });
  });
});
