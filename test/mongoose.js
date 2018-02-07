'use strict';
/* global afterEach, describe, it */

var expect = require('chai').expect;
var mongoose = require('mongoose');
console.log('Mongoose Version: ' + mongoose.version);
var SchemaAdapter = require('../adapters/mongoose');

var isMongoose3 = parseInt(mongoose.version.split('.')[0], 10) === 3;

afterEach(function (done) {
  delete mongoose.models.Foo;
  delete mongoose.modelSchemas.Foo;
  delete mongoose.models.User;
  delete mongoose.modelSchemas.User;
  delete mongoose.models.Bar;
  delete mongoose.modelSchemas.Bar;
  done();
});

describe('SchemaAdapter', function () {
  describe('Date', function () {
    it('should have the type `Date`', function (done) {
      var schema = mongoose.Schema({ foo: Date });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'Date');

          done(null);
        });
    });
  });

  describe('String', function () {
    it('should have the type `String`', function (done) {
      var schema = mongoose.Schema({ foo: String });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'String');

          done(null);
        });
    });
  });

  describe('Boolean', function () {
    it('should have the type `Boolean`', function (done) {
      var schema = mongoose.Schema({ foo: Boolean });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'Boolean');

          done(null);
        });
    });
  });

  describe('Number', function () {
    it('should have the type `Number`', function (done) {
      var schema = mongoose.Schema({ foo: Number });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'Number');

          done(null);
        });
    });
  });

  describe('Object', function () {
    it('should have the type `{ fields: [...]}`', function (done) {
      var schema = mongoose.Schema({
        foo: {
          field1: String,
          field2: Boolean
        }
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Object);
          expect(schema.fields[0].type).to.have.property('fields').and.to.be
            .instanceof(Object);
          expect(schema.fields[0].type.fields).to.have.length.of(2);
          expect(schema.fields[0].type.fields[0]).to.have
            .property('field', 'field1');
          expect(schema.fields[0].type.fields[0]).to.have
            .property('type', 'String');
          expect(schema.fields[0].type.fields[1]).to.have
            .property('field', 'field2');
          expect(schema.fields[0].type.fields[1]).to.have
            .property('type', 'Boolean');

          done(null);
        });
    });
  });

  describe('ObjectID', function () {
    it('should have the type `String`', function (done) {
      var schema = mongoose.Schema({
        foo: mongoose.Schema.Types.ObjectId
      });

      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'String');

          done(null);
        });
    });
  });

  describe('{}', function () {
    it('should have the type null', function (done) {
      var schema = mongoose.Schema({
        foo: {}
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].type).eql(null);

          done(null);
        });
    });
  });

  describe('[]', function () {
    it('should have the type [null]', function (done) {
      var schema = mongoose.Schema({
        foo: []
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].type).eql([null]);

          done(null);
        });
    });
  });

  describe('Array of dates', function () {
    it('should have the type `[\'Date\']`', function (done) {
      var schema = mongoose.Schema({
        foo: [Date]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Date']);

          done(null);
        });
    });
  });

  describe('Array of strings', function () {
    it('should have the type `[\'String\']`', function (done) {
      var schema = mongoose.Schema({
        foo: [String]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['String']);

          done(null);
        });
    });
  });

  describe('Array of bools', function () {
    it('should have the type `[\'Boolean\']`', function (done) {
      var schema = mongoose.Schema({
        foo: [Boolean]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Boolean']);

          done(null);
        });
    });
  });

  describe('Array of numbers', function () {
    it('should have the type `[\'Number\']`', function (done) {
      var schema = mongoose.Schema({
        foo: [Number]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Number']);

          done(null);
        });
    });
  });

  describe('Array of objectids ([ObjectId])', function () {
    it('should have the type `[String]`', function (done) {
      var schema = mongoose.Schema({ foo: [mongoose.Schema.Types.ObjectId] });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type')
            .eql(['String']);

          done(null);
        });
    });
  });

  describe('Array of objectids ([type: ObjectId])', function () {
    it('should have the type `[String]`', function (done) {
      mongoose.model('User', mongoose.Schema());
      var schema = mongoose.Schema({
        foo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type')
            .eql(['String']);
          expect(schema).to.have.deep.property('fields[0].reference')
            .eql('User._id');

          done(null);
        });
    });
  });

  describe('Array of {}', function () {
    it('should have the type [null]', function (done) {
      var schema = mongoose.Schema({
        foo: [{}]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].type).eql([null]);

          done(null);
        });
    });
  });

  describe('Array of objects', function () {
    it('should have the type fields: [{...}, {...}]', function (done) {
      var schema = mongoose.Schema({
        foo: [{
          field1: String,
          field2: Date
        }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.length.of(1);
          expect(schema.fields[0].type[0]).to.be.instanceof(Object).and.to
            .have.property('fields');
          expect(schema.fields[0].type[0].fields).to.be.instanceof(Array).and
            .have.length.of(2);
          expect(schema.fields[0].type[0].fields[0]).to.have.property('field')
            .eql('field1');
          expect(schema.fields[0].type[0].fields[0]).to.have.property('type')
            .eql('String');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('field')
            .eql('field2');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('type')
            .eql('Date');

          done(null);
        });
    });

    it('should support array of objects with syntax { type: String }', function (done) {
      var schema = mongoose.Schema({
        people: [{
          firstName: { type: String }
        }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields[0].type[0].fields[0]).to.have.property('type')
            .eql('String');
          done(null);
        });
    });

    it('should support array of object with sub schema', function (done) {
      var schemaEmbed = mongoose.Schema({
        field1: { type: String },
        field2: Date
      });

      var schema = mongoose.Schema({
        foo: [schemaEmbed]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.length.of(1);
          expect(schema.fields[0].type[0]).to.be.instanceof(Object).and.to
            .have.property('fields');
          expect(schema.fields[0].type[0].fields).to.be.instanceof(Array).and
            .have.length.of(3);
          expect(schema.fields[0].type[0].fields[0]).to.have.property('field')
            .eql('field1');
          expect(schema.fields[0].type[0].fields[0]).to.have.property('type')
            .eql('String');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('field')
            .eql('field2');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('type')
            .eql('Date');

          done(null);
        });
    });
  });

  describe('Array of schemas', function () {
    it('should have the type `{ fields: [...]}`', function (done) {
      var userSchema = mongoose.Schema({
        firstName: String,
        lastName: String,
        createdAt: Date
      });

      var schema = mongoose.Schema({
        users: [userSchema]
      });

      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('users');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.length.of(1);
          expect(schema.fields[0].type[0]).to.be.instanceof(Object).and.to
            .have.property('fields');

          expect(schema.fields[0].type[0].fields).to.be.eql([
            { field: 'firstName', type: 'String' },
            { field: 'lastName', type: 'String' },
            { field: 'createdAt', type: 'Date' },
            { field: '_id', type: 'String' }
          ]);

          done(null);
        });
    });
  });

  if (!isMongoose3) {
    describe('Array of schemas with reserved keyword "type"', function () {
      it('should have the type `{ fields: [...]}`', function (done) {
        var schema = mongoose.Schema({
          action: [{
            type: String,
            value: String,
          }]
        });
        var model = mongoose.model('Foo', schema);

        return new SchemaAdapter(model, {
          mongoose: mongoose,
          connections: [mongoose]
        })
          .then(function (schema) {
            expect(schema.fields[0].type[0].fields).to.be.eql([
              { field: 'type', type: 'String' },
              { field: 'value', type: 'String' },
            ]);

            done(null);
          });
      });
    });
  }

  describe('Shower of nested objects/arrays', function () {
    it('should have the type fields: [{...}, {...}]', function (done) {
      var schema = mongoose.Schema({
        foo: [{
          field1: [{
            field1Field1: [Date],
            field1Field2: { field2Field1: Boolean }
          }]
        }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.length.of(1);
          expect(schema.fields[0].type[0]).to.have.property('fields').with
            .length.of(1);
          expect(schema.fields[0].type[0].fields[0]).to.be.instanceof(Object)
            .and.to.have.property('field').eql('field1');
          expect(schema.fields[0].type[0].fields[0]).to.be.instanceof(Object)
            .and.to.have.property('type');
          expect(schema.fields[0].type[0].fields[0].type).to.be
            .instanceof(Array).with.length.of(1);
          expect(schema.fields[0].type[0].fields[0].type[0]).to.be
            .instanceof(Object).with.property('fields');
          expect(schema.fields[0].type[0].fields[0].type[0].fields).to.be
            .instanceof(Array).with.length(2);
          expect(schema.fields[0].type[0].fields[0].type[0].fields[0]).to.be
            .instanceof(Object).with.property('field').eql('field1Field1');
          expect(schema.fields[0].type[0].fields[0].type[0].fields[0]).to.have
            .property('type').eql(['Date']);
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1]).to.be
            .instanceof(Object).with.property('field').eql('field1Field2');
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1]).to.be
            .instanceof(Object).with.property('type').which.is
            .instanceof(Object).with.property('fields');
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1].type
            .fields).to.be.instanceof(Array).with.length.of(1);
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1].type
            .fields[0]).to.be.instanceof(Object).with.property('field')
            .eql('field2Field1');
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1].type
            .fields[0]).to.have.property('type').eql('Boolean');

          done(null);
        });
    });
  });

  describe('Nested object with hasOne relationship', function () {
    it('should have the reference set', function (done) {
      mongoose.model('User', mongoose.Schema());
      var schema = mongoose.Schema({
        foo: {
          bar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        }
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields[0].type.fields[0]).eql({
            field: 'bar',
            type: 'String',
            reference: 'User._id'
          });

          done(null);
        });
    });
  });

  describe('hasOne relationship', function () {
    it('should have the ref attribute set', function (done) {
      mongoose.model('Bar', mongoose.Schema());
      var schema = mongoose.Schema({
        foo: { type: String, ref: 'Bar' }
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].reference', 'Bar._id');

          done(null);
        });
    });
  });

  describe('hasMany relationship', function () {
    it('should have the ref attribute set', function (done) {
      mongoose.model('Bar', mongoose.Schema());
      var schema = mongoose.Schema({
        foos: [{ type: String, ref: 'Bar' }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].reference).eql('Bar._id');

          done(null);
        });
    });
  });

  describe('isRequired flag', function () {
    it('should be set to true', function (done) {
      var schema = mongoose.Schema({
        foo: { type: String, required: true },
        bar: String
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].isRequired).eql(true);

          done(null);
        });
    });
  });

  describe('isRequired flag', function () {
    it('should not appear', function (done) {
      var schema = mongoose.Schema({
        bar: String
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].isRequired).eql(undefined);

          done(null);
        });
    });
  });

  describe('__v', function () {
    it('should not appear', function (done) {
      var schema = mongoose.Schema({
        foo: String
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields.length).equal(2);
          done(null);
        });
    });
  });
});
