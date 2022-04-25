import mongoose from 'mongoose';
import mongooseConnect from '../../utils/mongoose-connect';
import { getNestedFieldType, getMongooseSchemaFromFieldPath } from '../../../src/utils/schema';

describe('schema', () => {
  let nestedModelSchema;

  beforeAll(async () => {
    await mongooseConnect();

    nestedModelSchema = mongoose.model('cars', new mongoose.Schema({
      engineSubSchemaAndType: new mongoose.Schema({
        horsePower: { type: String },
        _id: { type: mongoose.Schema.Types.ObjectId },
      }),
      engineSubSchema: new mongoose.Schema({
        horsePower: String,
        _id: mongoose.Schema.Types.ObjectId,
      }),
      engineNestedDocumentAndType: {
        type: {
          horsePower: { type: String },
          _id: { type: mongoose.Schema.Types.ObjectId },
        },
      },
      engineNestedDocument: {
        type: {
          horsePower: String,
          _id: mongoose.Schema.Types.ObjectId,
        },
      },
      engineNestedPathAndType: {
        horsePower: { type: String },
        _id: { type: mongoose.Schema.Types.ObjectId },
      },
      engineNestedPath: {
        horsePower: String,
        _id: mongoose.Schema.Types.ObjectId,
      },
    })).schema;
  });

  afterAll(() => mongoose.connection.close());

  describe('when the nested field is from a subSchema', () => {
    describe('when the nested field is defined using a type', () => {
      it('should correctly detect the type', () => {
        expect.assertions(2);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineSubSchemaAndType._id'),
        ).toStrictEqual(mongoose.Schema.Types.ObjectId);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineSubSchemaAndType.horsePower'),
        ).toStrictEqual(String);
      });
    });
    describe('when the nested field is not defined using a type', () => {
      it('should correctly detect the type', () => {
        expect.assertions(2);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineSubSchema._id'),
        ).toStrictEqual(mongoose.Schema.Types.ObjectId);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineSubSchema.horsePower'),
        ).toStrictEqual(String);
      });
    });
  });

  describe('when the nested field is from a nested document', () => {
    describe('when the nested field is defined using a type', () => {
      it('should correctly detect the type', () => {
        expect.assertions(2);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedDocumentAndType._id'),
        ).toStrictEqual(mongoose.Schema.Types.ObjectId);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedDocumentAndType.horsePower'),
        ).toStrictEqual(String);
      });
    });
    describe('when the nested field is not defined using a type', () => {
      it('should correctly detect the type', () => {
        expect.assertions(2);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedDocument._id'),
        ).toStrictEqual(mongoose.Schema.Types.ObjectId);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedDocument.horsePower'),
        ).toStrictEqual(String);
      });
    });
  });


  describe('when the nested field is from a nested path', () => {
    describe('when the nested field is defined using a type', () => {
      it('should correctly detect the type', () => {
        expect.assertions(2);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedPathAndType._id'),
        ).toStrictEqual(mongoose.Schema.Types.ObjectId);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedPathAndType.horsePower'),
        ).toStrictEqual(String);
      });
    });
    describe('when the nested field is not defined using a type', () => {
      it('should correctly detect the type', () => {
        expect.assertions(2);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedPath._id'),
        ).toStrictEqual(mongoose.Schema.Types.ObjectId);
        expect(
          getNestedFieldType(nestedModelSchema, 'engineNestedPath.horsePower'),
        ).toStrictEqual(String);
      });
    });
  });

  describe('when the nested field is not found', () => {
    it('should return undefined', () => {
      expect.assertions(1);

      expect(
        getNestedFieldType(nestedModelSchema, 'engineNestedPath.notExisting'),
      ).toBeUndefined();
    });
  });

  describe('getMongooseSchemaFromFieldPath', () => {
    let samplesModel;

    beforeAll(() => {
      const schema = new mongoose.Schema({
        subDocument: new mongoose.Schema({
          attribute1: String,
          attribute2: Number,
          nestedPath: {
            attribute3: String,
          },
        }),
        nestedPath: {
          attribute1: String,
          attribute2: Number,
        },
      });
      samplesModel = mongoose.model('samples', schema);
    });

    describe('when the field does not exist in schema', () => {
      it('should return null', () => {
        expect.assertions(1);

        const result = getMongooseSchemaFromFieldPath('subDocument.notExisting', samplesModel);

        expect(result).toBeNull();
      });
    });

    describe('when the field exists in schema', () => {
      describe('when the field is from a subDocument (subSchema)', () => {
        it('should return the field info', () => {
          expect.assertions(1);

          const fieldName = 'subDocument.attribute1';
          const fieldInfo = getMongooseSchemaFromFieldPath(fieldName, samplesModel);

          expect(fieldInfo).toBeDefined();
        });
      });

      describe('when the field is from a nestPath (nestedObject)', () => {
        it('should return the field info', () => {
          expect.assertions(1);

          const fieldName = 'nestedPath.attribute1';
          const fieldInfo = getMongooseSchemaFromFieldPath(fieldName, samplesModel);

          expect(fieldInfo).toBeDefined();
        });
      });

      describe('when the field is from both nestedPath and embeddedDocument', () => {
        it('should return the field info', () => {
          expect.assertions(1);

          const fieldName = 'subDocument.nestedPath.attribute3';
          const fieldInfo = getMongooseSchemaFromFieldPath(fieldName, samplesModel);

          expect(fieldInfo).toBeDefined();
        });
      });
    });
  });
});
