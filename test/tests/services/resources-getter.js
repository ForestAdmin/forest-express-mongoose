import { expect } from 'chai';
import mongoose from 'mongoose';
import loadFixture from 'mongoose-fixture-loader';
import Interface from 'forest-express';
import ResourcesGetter from '../../../src/services/resources-getter';
import mongooseConnect from '../../utils/mongoose-connect';

describe('Service > ResourcesGetter', () => {
  let OrderModel;

  const options = {
    mongoose,
    connections: [mongoose],
  };

  before(() => {
    Interface.Schemas = {
      schemas: {
        Order: {
          name: 'Order',
          idField: 'id',
          primaryKeys: ['id'],
          isCompositePrimary: false,
          searchFields: ['amount', 'comment'],
          fields: [
            { field: 'id', type: 'Number' },
            { field: 'amount', type: 'Number' },
            { field: 'comment', type: 'String' },
            { field: 'giftMessage', type: 'String' },
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
        });

        OrderModel = mongoose.model('Order', OrderSchema);

        return OrderModel.remove({});
      })
      .then(() => {
        return loadFixture(OrderModel, [
          {
            // id: 100,
            amount: 199,
            comment: 'no comment!',
            giftMessage: 'Here is your gift',
          },
          {
            // id: 101,
            amount: 1399,
            comment: 'this is a gift',
            giftMessage: 'Thank you',
          },
        ]);
      });
  });

  after((done) => {
    mongoose.connection.close();
    done();
  });

  describe('Request on the resources getter with a search on a collection with searchFields', () => {
    it('should retrieve the record with `gift` value in `comment` field', (done) => {
      const parameters = {
        fields: {
          order: 'id,amount,description,giftComment',
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
});
