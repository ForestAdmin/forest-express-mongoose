import mongoose from 'mongoose';
import mongooseConnect from '../../utils/mongoose-connect';
import { getNestedFieldType } from '../../../src/utils/schema';

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
});
