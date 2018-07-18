var expect = require('chai').expect;
var mongoose = require('mongoose');
var loadFixture = require('mongoose-fixture-loader');
var ResourcesGetter = require('../../../services/resources-getter');
var Interface = require('forest-express');
var mongooseConnect = require('../../utils/mongoose-connect');

describe('Service > ResourcesGetter', function () {
  var OrderModel;

  var options = {
    mongoose: mongoose,
    connections: [mongoose],
  };

  before(function () {
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
            { field: 'giftMessage', type: 'String' }
          ]
        },
      }
    };

    return mongooseConnect()
      .then(function () {
        var OrderSchema = mongoose.Schema({
          amount: { type: Number },
          comment: { type: String },
          giftMessage: { type: String },
        });

        OrderModel = mongoose.model('Order', OrderSchema);

        return OrderModel.remove({});
      })
      .then(function () {
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
          }
        ]);
      });
  });

  after(function (done) {
    mongoose.connection.close();
    done();
  });

  describe('Request on the resources getter with a search on a collection with searchFields', function () {
    it('should retrieve the record with `gift` value in `comment` field', function (done) {
      var parameters = {
        fields: {
          order: 'id,amount,description,giftComment'
        },
        page: { number: '1', size: '30' },
        search: 'gift',
        timezone: '+02:00'
      };

      new ResourcesGetter(OrderModel, options, parameters)
        .perform()
        .then(function (result) {
          expect(result[0].length).equal(1);
          expect(result[0][0].comment).to.match(/gift/);
          done();
        })
        .catch(done);
    });

    it('should retrieve the count of the records', function (done) {
      var parameters = {
        search: 'gift',
        timezone: '+02:00'
      };

      new ResourcesGetter(OrderModel, options, parameters)
        .count()
        .then(function (count) {
          expect(count).equal(1);
          done();
        })
        .catch(done);
    });
  });
});
