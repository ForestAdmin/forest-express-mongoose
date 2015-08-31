'use strict';
/* global describe, it */

//var expect = require('chai').expect;
var mongoose = require('mongoose');
console.log('Mongoose Version: ' + mongoose.version);
var ResourceDeserializer = require('../../deserializers/resource');

describe('Resource Deserializer', function () {
  describe('FOO', function () {
    it('should', function (done) {
      new ResourceDeserializer({
        data: {
          id: '54735750e16638ba1eee59cb',
          attributes: {
            url: null,
            free: false,
            timestamp: '2014-11-24T16:05:36.148Z',
            illustration: {
              series: {
                _id: '545a5ce40d1547253230397d',
                name: 'Forestry Industry',
                owner: '5404760d465b07b47265bf87',
                __v: 0,
                'created_at': '2014-11-05T17:22:44.838Z',
                'edited_at': '2014-11-05T17:22:44.838Z'
              },
              style: 3,
              subcategory: 2,
              _id: '54622383b85026717809648a',
              category: '7',
              name: 'Timber Crane Machine',
              owner: {
                _id: '5404760d465b07b47265bf87',
                'created_at': '2014-09-01T13:35:09.300Z',
                email: 'krisna.adiwiyana@gmail.com',
                'first_name': 'Krisna',
                'last_name': 'Adi Wiyana',
                password: '$2a$08$N1aMF72wvzudKmOkM3RVk.MTwzbiLc6flAuklXd8mm/hW.bM9zINu',
                roles: {
                  admin: false,
                  client: false,
                  contributor: true
                },
                __v: 0
              }
            }
          },
          relationships: {
            user: {
              data: {
                type: 'users',
                id: '54033b75ed373cf17f2bf0c6'
              }
            }
          },
          type: 'exportlogs'
        }
      })
        .perform()
        .then(function (result) {
          console.log(require('util').inspect(result, { depth: null }));
          done();
        });
    });
  });
});

