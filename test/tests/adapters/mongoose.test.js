const mongoose = require('mongoose');
const SchemaAdapter = require('../../../src/adapters/mongoose');

const { Schema } = mongoose;

describe('adapters > schema-adapter', () => {
  afterEach((done) => {
    delete mongoose.models.Foo;
    delete mongoose.modelSchemas.Foo;
    delete mongoose.models.User;
    delete mongoose.modelSchemas.User;
    delete mongoose.models.Bar;
    delete mongoose.modelSchemas.Bar;
    done();
  });

  describe('type Date', () => {
    it('should have the type Date', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({ foo: Date });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', 'Date');
    });
  });

  describe('type String', () => {
    it('should have the type String', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({ foo: String });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', 'String');
    });
  });

  describe('type Boolean', () => {
    it('should have the type Boolean', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({ foo: Boolean });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', 'Boolean');
    });
  });

  describe('type Number', () => {
    it('should have the type Number', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({ foo: Number });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', 'Number');
    });
  });

  describe('type object', () => {
    it('should have the type { fields: [...]}', async () => {
      expect.assertions(10);
      const schema = mongoose.Schema({
        foo: {
          field1: String,
          field2: Boolean,
        },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('type');
      expect(result.fields[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type).toHaveProperty('fields');
      expect(result.fields[0].type).toBeInstanceOf(Object);
      expect(result.fields[0].type.fields).toHaveLength(2);
      expect(result.fields[0].type.fields[0]).toHaveProperty('field', 'field1');
      expect(result.fields[0].type.fields[0]).toHaveProperty('type', 'String');
      expect(result.fields[0].type.fields[1]).toHaveProperty('field', 'field2');
      expect(result.fields[0].type.fields[1]).toHaveProperty('type', 'Boolean');
    });
  });

  describe('type ObjectID', () => {
    it('should have the type String', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({
        foo: mongoose.Schema.Types.ObjectId,
      });

      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', 'String');
    });
  });

  describe('{}', () => {
    it('should have the type Json', async () => {
      expect.assertions(5);
      const schema = mongoose.Schema({
        foo: {},
        foo2: { type: {} },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual('Json');
      expect(result.fields[1].field).toStrictEqual('foo2');
      expect(result.fields[1].type).toStrictEqual('Json');
    });
  });

  describe('type Object', () => {
    it('should have the type Json', async () => {
      expect.assertions(5);
      const schema = mongoose.Schema({
        foo: Object,
        foo2: { type: Object },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual('Json');
      expect(result.fields[1].field).toStrictEqual('foo2');
      expect(result.fields[1].type).toStrictEqual('Json');
    });
  });

  describe('[]', () => {
    it('should have the type Json', async () => {
      expect.assertions(5);
      const schema = mongoose.Schema({
        foo: [],
        foo2: { type: [] },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual('Json');
      expect(result.fields[1].field).toStrictEqual('foo2');
      expect(result.fields[1].type).toStrictEqual('Json');
    });
  });

  describe('array of dates', () => {
    it('should have the type [\'Date\']', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({
        foo: [Date],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual(['Date']);
    });
  });

  describe('array of strings', () => {
    it('should have the type [\'String\']', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({
        foo: [String],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual(['String']);
    });
  });

  describe('array of booleans', () => {
    it('should have the type [\'Boolean\']', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({
        foo: [Boolean],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual(['Boolean']);
    });
  });

  describe('array of numbers', () => {
    it('should have the type [\'Number\']', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({
        foo: [Number],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual(['Number']);
    });
  });

  describe('array of objectids ([ObjectId])', () => {
    it('should have the type [String]', async () => {
      expect.assertions(3);
      const schema = mongoose.Schema({
        foo: [mongoose.Schema.Types.ObjectId],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', ['String']);
    });
  });

  describe('array of objectids ([type: ObjectId])', () => {
    it('should have the type [String]', async () => {
      expect.assertions(4);
      mongoose.model('User', mongoose.Schema());
      const schema = mongoose.Schema({
        foo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('field', 'foo');
      expect(result.fields[0]).toHaveProperty('type', ['String']);
      expect(result.fields[0]).toHaveProperty('reference', 'User._id');
    });
  });

  describe('array of {}', () => {
    it('should have the type [Json]', async () => {
      expect.assertions(5);
      const schema = mongoose.Schema({
        foo: [{}],
        foo2: { type: [{}] },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0].type).toStrictEqual(['Json']);
      expect(result.fields[1].field).toStrictEqual('foo2');
      expect(result.fields[1].type).toStrictEqual(['Json']);
    });
  });

  describe('array of objects', () => {
    it('should have the type fields: [{...}, {...}]', async () => {
      expect.assertions(13);
      const schema = mongoose.Schema({
        foo: [{
          field1: String,
          field2: Date,
        }],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0]).toHaveProperty('type');
      expect(result.fields[0].type).toBeInstanceOf(Array);
      expect(result.fields[0].type).toHaveLength(1);
      expect(result.fields[0].type[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0]).toHaveProperty('fields');
      expect(result.fields[0].type[0].fields).toBeInstanceOf(Array);
      expect(result.fields[0].type[0].fields).toHaveLength(2);
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('field', 'field1');
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('type', 'String');
      expect(result.fields[0].type[0].fields[1]).toHaveProperty('field', 'field2');
      expect(result.fields[0].type[0].fields[1]).toHaveProperty('type', 'Date');
    });

    it('should support array of objects with syntax { type: String }', async () => {
      expect.assertions(1);
      const schema = mongoose.Schema({
        people: [{
          firstName: { type: String },
        }],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('type', 'String');
    });

    it('should support array of object with sub schema', async () => {
      expect.assertions(13);
      const schemaEmbed = mongoose.Schema({
        field1: { type: String },
        field2: Date,
      });

      const schema = mongoose.Schema({
        foo: [schemaEmbed],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0]).toHaveProperty('type');
      expect(result.fields[0].type).toBeInstanceOf(Array);
      expect(result.fields[0].type).toHaveLength(1);
      expect(result.fields[0].type[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0]).toHaveProperty('fields');
      expect(result.fields[0].type[0].fields).toBeInstanceOf(Array);
      expect(result.fields[0].type[0].fields).toHaveLength(3);
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('field', 'field1');
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('type', 'String');
      expect(result.fields[0].type[0].fields[1]).toHaveProperty('field', 'field2');
      expect(result.fields[0].type[0].fields[1]).toHaveProperty('type', 'Date');
    });
  });

  describe('array of schemas', () => {
    it('should have the type `{ fields: [...]}`', async () => {
      expect.assertions(8);
      const userSchema = mongoose.Schema({
        firstName: String,
        lastName: String,
        createdAt: Date,
      });

      const schema = mongoose.Schema({
        users: [userSchema],
      });

      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('users');
      expect(result.fields[0]).toHaveProperty('type');
      expect(result.fields[0].type).toBeInstanceOf(Array);
      expect(result.fields[0].type).toHaveLength(1);
      expect(result.fields[0].type[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0]).toHaveProperty('fields');

      expect(result.fields[0].type[0].fields).toStrictEqual([
        { field: 'firstName', type: 'String' },
        { field: 'lastName', type: 'String' },
        { field: 'createdAt', type: 'Date' },
        { field: '_id', type: 'String' },
      ]);
    });
  });

  describe('array of schemas with reserved keyword "type"', () => {
    it('should have the type `{ fields: [...]}`', async () => {
      expect.assertions(1);
      const schema = mongoose.Schema({
        action: [{
          type: String,
          value: String,
        }],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result.fields[0].type[0].fields).toStrictEqual([
        { field: 'type', type: 'String' },
        { field: 'value', type: 'String' },
      ]);
    });
  });

  describe('shower of nested objects/arrays', () => {
    it('should have the type fields: [{...}, {...}]', async () => {
      expect.assertions(31);
      const schema = mongoose.Schema({
        foo: [{
          field1: [{
            field1Field1: [Date],
            field1Field2: { field2Field1: Boolean },
          }],
        }],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].field).toStrictEqual('foo');
      expect(result.fields[0]).toHaveProperty('type');
      expect(result.fields[0].type).toBeInstanceOf(Array);
      expect(result.fields[0].type).toHaveLength(1);
      expect(result.fields[0].type[0]).toHaveProperty('fields');
      expect(result.fields[0].type[0].fields).toHaveLength(1);
      expect(result.fields[0].type[0].fields[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('field', 'field1');
      expect(result.fields[0].type[0].fields[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0]).toHaveProperty('type');
      expect(result.fields[0].type[0].fields[0].type).toBeInstanceOf(Array);
      expect(result.fields[0].type[0].fields[0].type).toHaveLength(1);
      expect(result.fields[0].type[0].fields[0].type[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0].type[0]).toHaveProperty('fields');
      expect(result.fields[0].type[0].fields[0].type[0].fields).toBeInstanceOf(Array);
      expect(result.fields[0].type[0].fields[0].type[0].fields).toHaveLength(2);
      expect(result.fields[0].type[0].fields[0].type[0].fields[0]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0].type[0].fields[0]).toHaveProperty('field', 'field1Field1');
      expect(result.fields[0].type[0].fields[0].type[0].fields[0]).toHaveProperty('type', ['Date']);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1]).toHaveProperty('field', 'field1Field2');
      expect(result.fields[0].type[0].fields[0].type[0].fields[1]).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1]).toHaveProperty('type');
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type).toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type).toHaveProperty('fields');
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type.fields)
        .toBeInstanceOf(Array);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type.fields).toHaveLength(1);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type.fields[0])
        .toBeInstanceOf(Object);
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type.fields[0]).toHaveProperty('field', 'field2Field1');
      expect(result.fields[0].type[0].fields[0].type[0].fields[1].type.fields[0]).toHaveProperty('type', 'Boolean');
    });
  });

  describe('deep nested objects', () => {
    it('should have the correct schema', async () => {
      expect.assertions(1);
      const schema = mongoose.Schema({
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
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      // eslint-disable-next-line global-require
      expect(result).toStrictEqual(require('./expected-results/deep-nested-object'));
    });
  });

  describe('deep nested schema', () => {
    it('should have the correct schema', async () => {
      expect.assertions(1);
      const schema = new Schema({
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

      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      // eslint-disable-next-line global-require
      expect(result).toStrictEqual(require('./expected-results/deep-nested-schema'));
    });
  });

  describe('complex schema', () => {
    it('should have the correct schema', async () => {
      expect.assertions(1);
      // eslint-disable-next-line global-require
      const complexModel = require('./schemas/complex-shema');

      const result = await new SchemaAdapter(complexModel, {
        mongoose,
        connections: [mongoose],
      });
      // eslint-disable-next-line global-require
      expect(result).toStrictEqual(require('./expected-results/real-world-schema'));
    });
  });

  describe('nested object with hasOne relationship', () => {
    it('should have the reference set', async () => {
      expect.assertions(1);
      mongoose.model('User', mongoose.Schema());
      const schema = mongoose.Schema({
        foo: {
          bar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result.fields[0].type.fields[0]).toStrictEqual({
        field: 'bar',
        type: 'String',
        reference: 'User._id',
      });
    });
  });

  describe('hasOne relationship', () => {
    it('should have the ref attribute set', async () => {
      expect.assertions(2);
      mongoose.model('Bar', mongoose.Schema());
      const schema = mongoose.Schema({
        foo: { type: String, ref: 'Bar' },
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0]).toHaveProperty('reference', 'Bar._id');
    });
  });

  describe('hasMany relationship', () => {
    it('should have the ref attribute set', async () => {
      expect.assertions(2);
      mongoose.model('Bar', mongoose.Schema());
      const schema = mongoose.Schema({
        foos: [{ type: String, ref: 'Bar' }],
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].reference).toStrictEqual('Bar._id');
    });
  });

  describe('isRequired flag', () => {
    it('should be set to true', async () => {
      expect.assertions(2);
      const schema = mongoose.Schema({
        foo: { type: String, required: true },
        bar: String,
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].isRequired).toStrictEqual(true);
    });
  });

  describe('"isRequired" flag', () => {
    it('should not appear', async () => {
      expect.assertions(2);
      const schema = mongoose.Schema({
        bar: String,
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result).toHaveProperty('fields');
      expect(result.fields[0].isRequired).toBeUndefined();
    });
  });

  describe('__v', () => {
    it('should not appear', async () => {
      expect.assertions(1);
      const schema = mongoose.Schema({
        foo: String,
      });
      const model = mongoose.model('Foo', schema);

      const result = await new SchemaAdapter(model, {
        mongoose,
        connections: [mongoose],
      });
      expect(result.fields).toHaveLength(2);
    });
  });
});
