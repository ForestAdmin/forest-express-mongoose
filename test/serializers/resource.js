'use strict';
/* global describe, it */

//var expect = require('chai').expect;
var mongoose = require('mongoose');
console.log('Mongoose Version: ' + mongoose.version);
var ResourceSerializer = require('../../serializers/resource');

describe('Resource Serializer', function () {
  describe('FOO', function () {
    it('should', function (done) {
      mongoose.model('User', mongoose.Schema({ }));
      mongoose.model('Illustration', mongoose.Schema({ }));
      mongoose.model('Serie', mongoose.Schema({ }));

      var model = mongoose.model('ExportLog', mongoose.Schema({
        timestamp: { type : Date, default: Date.now, index: true },
        free: {type: Boolean, default: true, index: true},
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        illustration: {
          _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Illustration', index: true },
          series: { type: mongoose.Schema.Types.ObjectId, ref: 'Serie' },
          category: Number,
          name: String,
          subcategory: Number,
          style: Number,
          owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        },
        customization: {},
        exportOptions: {},
        url: String
      }));

      var dataSet = {
        _id: '54902a3e69e49d0c4f9fc6e7',
        timestamp: 'Tue Dec 16 2014 13: 49: 02 GMT + 0100(CET)',
        user: {
          _id: '549027ea69e49d0c4f9fc6b6',
          email: 'mathias.garny@rolandberger.com',
          roles: {
            client: true,
            admin: false,
            contributor: false
          },
          createdAt: 'Tue Dec 16 2014 13: 39: 06 GMT + 0100(CET)',
          __v: 0,
          password: '$2a$08$UxkbBUD2PkFhBUPjiNUk6e6EiQAdW7opis3JJ/is7Fcp5if4H444a',
          lastName: 'Garny',
          firstName: 'Mathias'
        },
        __v: 0,
        customization: {
          color3: '#A8D9E8',
          color1: '#7AB0CE',
          slider1: 200,
          knob: 0
        },
        exportOptions: {
          format: 'pdf',
          orientation: 'portrait',
          paperSize: 'A4',
          quality: 90,
          height: 512,
          width: 512
        },
        illustration: {
          subcategory: 5,
          _id: '545c24d90d15472532303a8c',
          category: 6,
          name: 'Blender',
          owner: {
            _id: '544ea52401cc53925dc01f44',
            lastName: 'Corporon',
            password: '$2a$08$X8fm5io6eN4pO7Vxp6CoCugPAnyQTDNLcagqOJRklm2N8vF.Qt06a',
            roles: {
              admin: false,
              client: false,
              contributor: true
            },
            __v: 0,
            createdAt: 'Mon Oct 27 2014 21: 03: 48 GMT + 0100(CET)',
            email: 'dani@daniellecorporon.com',
            firstName: 'Danielle'
          },
          series: {
            _id: '544eb10b01cc53925dc01f55',
            name: 'Kitchen and Home Appliances',
            owner: '544ea52401cc53925dc01f44',
            editedAt: 'Mon Oct 27 2014 21: 54: 35 GMT + 0100(CET)',
            createdAt: 'Mon Oct 27 2014 21: 54: 35 GMT + 0100(CET)',
            __v: 0
          },
          style: 3
        }
      };

      new ResourceSerializer(model, dataSet, {
        mongoose: mongoose
      })
        .perform()
        .then(function (json) {
          console.log(require('util').inspect(json, { depth: null }));
          done(null, json);
        });
    });
  });
});
