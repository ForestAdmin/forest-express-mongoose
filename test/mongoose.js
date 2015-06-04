'use strict';
/* global afterEach, describe, it */

var expect = require('chai').expect;
var mongoose = require('mongoose');
console.log('Mongoose Version: ' + mongoose.version);
var SchemaAdapter = require('../adapters/mongoose');

afterEach(function (done) {
  delete mongoose.models.Foo;
  delete mongoose.modelSchemas.Foo;
  done();
});

describe('SchemaAdapter', function () {
  describe('Date', function () {
    it('should have the type `Date`', function (done) {
      var schema = mongoose.Schema({ foo: Date });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'Number');

          done(null);
        });
    });
  });

  describe('Object', function () {
    it('should have the type `{ fields: [ ... ]}`', function (done) {
      var schema = mongoose.Schema({
        foo: {
          field1: String,
          field2: Boolean
        }
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type', 'String');

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

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Number']);

          done(null);
        });
    });
  });

  describe('Array of objectids', function () {
    it('should have the type `[String]`', function (done) {
      var schema = mongoose.Schema({ foo: [mongoose.Schema.Types.ObjectId] });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].field', 'foo');
          expect(schema).to.have.deep.property('fields[0].type')
            .eql(['String']);

          done(null);
        });
    });
  });

  describe('Array of objects', function () {
    it('should have [dot notations for fields]', function (done) {
      var schema = mongoose.Schema({
        foo: [{
          field1: String,
          field2: Date
        }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
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
  });

  describe('Shower of nested objects/arrays', function () {
    it('should have [dot notations for fields]', function (done) {
      var schema = mongoose.Schema({
        foo: [{
          field1: [{
            field1Field1: [Date],
            field1Field2: { field2Field1: Boolean }
          }]
        }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
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

  describe('hasOne relationship', function () {
    it('should have the ref attribute set', function (done) {
      var schema = mongoose.Schema({
        foo: { type: String, ref: 'Bar' }
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.deep.property('fields[0].ref', 'Bar._id');

          done(null);
        });
    });
  });

  describe('hasMany relationship', function () {
    it('should have the ref attribute set', function (done) {
      var schema = mongoose.Schema({
        foos: [{ type: String, ref: 'Bar' }]
      });
      var model = mongoose.model('Foo', schema);

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].ref).eql('Bar._id');

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

      return new SchemaAdapter(model)
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

      return new SchemaAdapter(model)
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[1].isRequired).eql(undefined);

          done(null);
        });
    });
  });
});
