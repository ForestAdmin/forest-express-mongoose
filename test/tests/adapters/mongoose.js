'use strict';
/* global afterEach, describe, it */

var mongoose = require('mongoose');
var SchemaAdapter = require('../../../src/adapters/mongoose');
var chai = require('chai');
var chaiSubset = require('chai-subset');

var expect = chai.expect;
var Schema = mongoose.Schema;

chai.use(chaiSubset);

describe('Adapters > SchemaAdapter', function () {
  afterEach(function (done) {
    delete mongoose.models.Foo;
    delete mongoose.modelSchemas.Foo;
    delete mongoose.models.User;
    delete mongoose.modelSchemas.User;
    delete mongoose.models.Bar;
    delete mongoose.modelSchemas.Bar;
    done();
  });

  describe('Date', function () {
    it('should have the type Date', function (done) {
      var schema = mongoose.Schema({ foo: Date });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type', 'Date');

          done();
        })
        .catch(done);
    });
  });

  describe('String', function () {
    it('should have the type String', function (done) {
      var schema = mongoose.Schema({ foo: String });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type', 'String');

          done();
        })
        .catch(done);
    });
  });

  describe('Boolean', function () {
    it('should have the type Boolean', function (done) {
      var schema = mongoose.Schema({ foo: Boolean });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type', 'Boolean');

          done();
        })
        .catch(done);
    });
  });

  describe('Number', function () {
    it('should have the type Number', function (done) {
      var schema = mongoose.Schema({ foo: Number });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type', 'Number');

          done();
        })
        .catch(done);
    });
  });

  describe('Object', function () {
    it('should have the type { fields: [...]}', function (done) {
      var schema = mongoose.Schema({
        foo: {
          field1: String,
          field2: Boolean
        }
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Object);
          expect(schema.fields[0].type).to.have.property('fields').and.to.be
            .instanceof(Object);
          expect(schema.fields[0].type.fields).to.have.lengthOf(2);
          expect(schema.fields[0].type.fields[0]).to.have
            .property('field', 'field1');
          expect(schema.fields[0].type.fields[0]).to.have
            .property('type', 'String');
          expect(schema.fields[0].type.fields[1]).to.have
            .property('field', 'field2');
          expect(schema.fields[0].type.fields[1]).to.have
            .property('type', 'Boolean');

          done();
        })
        .catch(done);
    });
  });

  describe('ObjectID', function () {
    it('should have the type String', function (done) {
      var schema = mongoose.Schema({
        foo: mongoose.Schema.Types.ObjectId
      });

      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type', 'String');

          done();
        })
        .catch(done);
    });
  });

  describe('{}', function () {
    it('should have the type Json', function (done) {
      var schema = mongoose.Schema({
        foo: {},
        foo2: { type: {} }
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql('Json');
          expect(schema.fields[1].field).eql('foo2');
          expect(schema.fields[1].type).eql('Json');

          done();
        })
        .catch(done);
    });
  });

  describe('Object', function () {
    it('should have the type Json', function (done) {
      var schema = mongoose.Schema({
        foo: Object,
        foo2: { type: Object },
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql('Json');
          expect(schema.fields[1].field).eql('foo2');
          expect(schema.fields[1].type).eql('Json');

          done();
        })
        .catch(done);
    });
  });

  describe('[]', function () {
    it('should have the type Json', function (done) {
      var schema = mongoose.Schema({
        foo: [],
        foo2: { type: [] }
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql('Json');
          expect(schema.fields[1].field).eql('foo2');
          expect(schema.fields[1].type).eql('Json');

          done();
        })
        .catch(done);
    });
  });

  describe('Array of dates', function () {
    it('should have the type [\'Date\']', function (done) {
      var schema = mongoose.Schema({
        foo: [Date]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Date']);

          done();
        })
        .catch(done);
    });
  });

  describe('Array of strings', function () {
    it('should have the type [\'String\']', function (done) {
      var schema = mongoose.Schema({
        foo: [String]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['String']);

          done();
        })
        .catch(done);
    });
  });

  describe('Array of booleans', function () {
    it('should have the type [\'Boolean\']', function (done) {
      var schema = mongoose.Schema({
        foo: [Boolean]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Boolean']);

          done();
        })
        .catch(done);
    });
  });

  describe('Array of numbers', function () {
    it('should have the type [\'Number\']', function (done) {
      var schema = mongoose.Schema({
        foo: [Number]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Number']);

          done();
        })
        .catch(done);
    });
  });

  describe('Array of objectids ([ObjectId])', function () {
    it('should have the type [String]', function (done) {
      var schema = mongoose.Schema({ foo: [mongoose.Schema.Types.ObjectId] });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type')
            .eql(['String']);

          done();
        })
        .catch(done);
    });
  });

  describe('Array of objectids ([type: ObjectId])', function () {
    it('should have the type [String]', function (done) {
      mongoose.model('User', mongoose.Schema());
      var schema = mongoose.Schema({
        foo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].field', 'foo');
          expect(schema).to.have.nested.property('fields[0].type')
            .eql(['String']);
          expect(schema).to.have.nested.property('fields[0].reference')
            .eql('User._id');

          done();
        })
        .catch(done);
    });
  });

  describe('Array of {}', function () {
    it('should have the type [Json]', function (done) {
      var schema = mongoose.Schema({
        foo: [{}],
        foo2: { type: [{}] }
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0].type).eql(['Json']);
          expect(schema.fields[1].field).eql('foo2');
          expect(schema.fields[1].type).eql(['Json']);

          done();
        })
        .catch(done);
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

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.lengthOf(1);
          expect(schema.fields[0].type[0]).to.be.instanceof(Object).and.to
            .have.property('fields');
          expect(schema.fields[0].type[0].fields).to.be.instanceof(Array).and
            .have.lengthOf(2);
          expect(schema.fields[0].type[0].fields[0]).to.have.property('field')
            .eql('field1');
          expect(schema.fields[0].type[0].fields[0]).to.have.property('type')
            .eql('String');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('field')
            .eql('field2');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('type')
            .eql('Date');

          done();
        })
        .catch(done);
    });

    it('should support array of objects with syntax { type: String }', function (done) {
      var schema = mongoose.Schema({
        people: [{
          firstName: { type: String }
        }]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields[0].type[0].fields[0]).to.have.property('type')
            .eql('String');
          done();
        })
        .catch(done);
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

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.lengthOf(1);
          expect(schema.fields[0].type[0]).to.be.instanceof(Object).and.to
            .have.property('fields');
          expect(schema.fields[0].type[0].fields).to.be.instanceof(Array).and
            .have.lengthOf(3);
          expect(schema.fields[0].type[0].fields[0]).to.have.property('field')
            .eql('field1');
          expect(schema.fields[0].type[0].fields[0]).to.have.property('type')
            .eql('String');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('field')
            .eql('field2');
          expect(schema.fields[0].type[0].fields[1]).to.have.property('type')
            .eql('Date');

          done();
        })
        .catch(done);
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

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('users');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.lengthOf(1);
          expect(schema.fields[0].type[0]).to.be.instanceof(Object).and.to
            .have.property('fields');

          expect(schema.fields[0].type[0].fields).to.be.eql([
            { field: 'firstName', type: 'String' },
            { field: 'lastName', type: 'String' },
            { field: 'createdAt', type: 'Date' },
            { field: '_id', type: 'String' }
          ]);

          done();
        })
        .catch(done);
    });
  });

  describe('Array of schemas with reserved keyword "type"', function () {
    it('should have the type `{ fields: [...]}`', function (done) {
      var schema = mongoose.Schema({
        action: [{
          type: String,
          value: String,
        }]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields[0].type[0].fields).to.be.eql([
            { field: 'type', type: 'String' },
            { field: 'value', type: 'String' },
          ]);

          done();
        })
        .catch(done);
    });
  });

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

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].field).eql('foo');
          expect(schema.fields[0]).to.have.property('type').and.to.be
            .instanceof(Array).and.have.lengthOf(1);
          expect(schema.fields[0].type[0]).to.have.property('fields').with
            .lengthOf(1);
          expect(schema.fields[0].type[0].fields[0]).to.be.instanceof(Object)
            .and.to.have.property('field').eql('field1');
          expect(schema.fields[0].type[0].fields[0]).to.be.instanceof(Object)
            .and.to.have.property('type');
          expect(schema.fields[0].type[0].fields[0].type).to.be
            .instanceof(Array).with.lengthOf(1);
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
            .fields).to.be.instanceof(Array).with.lengthOf(1);
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1].type
            .fields[0]).to.be.instanceof(Object).with.property('field')
            .eql('field2Field1');
          expect(schema.fields[0].type[0].fields[0].type[0].fields[1].type
            .fields[0]).to.have.property('type').eql('Boolean');

          done();
        })
        .catch(done);
    });
  });

  describe('Deep nested objects', function () {
    it('should have the correct schema', function (done) {
      var schema = mongoose.Schema({
        depth1: {
          field1: [Date],
          field2: { field2Field1: Boolean },
          depth2: {
            field1: [Date],
            field2: { field2Field1: Boolean },
            depth3: {
              field1: [Date],
              field2: { field2Field1: Boolean },
              depth4: {
                field1: [Date],
                field2: { field2Field1: Boolean },
                depth5: {
                  field1: [Date],
                  field2: { field2Field1: Boolean },
                  depth6: {
                    field1: [Date],
                    field2: { field2Field1: Boolean },
                    depth7: {
                      field1: [Date],
                      field2: { field2Field1: Boolean },
                    },
                  },
                },
              },
            },
          },
        },
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.containSubset(require('./expected-results/deep-nested-object'));
          done();
        })
        .catch(done);
    });
  });

  describe('Deep nested schema', function () {
    it('should have the correct schema', function (done) {
      var schema = new Schema({
        field1: [Date],
        field2: { field2Field1: Boolean },
        depth1: new Schema({
          depth1Field1: [Date],
          depth1Field2: { depth1Field2Field1: Boolean },
          depth2: [
            new Schema({
              depth2Field1: [Date],
              depth2Field2: { depth2Field2Field1: Boolean },
            }),
          ],
        }),
      });

      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.containSubset(require('./expected-results/deep-nested-schema'));
          done();
        })
        .catch(done);
    });
  });

  describe('Complex schema', function () {
    it('should have the correct schema', function (done) {
      var complexModel = require('./schemas/complex-shema');

      new SchemaAdapter(complexModel, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.containSubset(require('./expected-results/real-world-schema'));
          done();
        })
        .catch(done);
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

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields[0].type.fields[0]).eql({
            field: 'bar',
            type: 'String',
            reference: 'User._id'
          });

          done();
        })
        .catch(done);
    });
  });

  describe('hasOne relationship', function () {
    it('should have the ref attribute set', function (done) {
      mongoose.model('Bar', mongoose.Schema());
      var schema = mongoose.Schema({
        foo: { type: String, ref: 'Bar' }
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema).to.have.nested.property('fields[0].reference', 'Bar._id');

          done();
        })
        .catch(done);
    });
  });

  describe('hasMany relationship', function () {
    it('should have the ref attribute set', function (done) {
      mongoose.model('Bar', mongoose.Schema());
      var schema = mongoose.Schema({
        foos: [{ type: String, ref: 'Bar' }]
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].reference).eql('Bar._id');

          done();
        })
        .catch(done);
    });
  });

  describe('isRequired flag', function () {
    it('should be set to true', function (done) {
      var schema = mongoose.Schema({
        foo: { type: String, required: true },
        bar: String
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].isRequired).eql(true);

          done();
        })
        .catch(done);
    });
  });

  describe('isRequired flag', function () {
    it('should not appear', function (done) {
      var schema = mongoose.Schema({
        bar: String
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema).to.have.property('fields');
          expect(schema.fields[0].isRequired).eql(undefined);

          done();
        })
        .catch(done);
    });
  });

  describe('__v', function () {
    it('should not appear', function (done) {
      var schema = mongoose.Schema({
        foo: String
      });
      var model = mongoose.model('Foo', schema);

      new SchemaAdapter(model, {
        mongoose: mongoose,
        connections: [mongoose]
      })
        .then(function (schema) {
          expect(schema.fields.length).equal(2);
          done();
        })
        .catch(done);
    });
  });
});
