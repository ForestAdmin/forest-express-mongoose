import ProjectionBuilder from '../../../src/services/projection-builder';

describe('service > projection-builder', () => {
  describe('findRequestSmartField', () => {
    it('should return the intersect between request fields and schema fields', () => {
      expect.assertions(1);

      const schemaWithSmartFields = {
        fields: [
          {
            field: 'firstname',
            type: 'String',
          },
          {
            field: 'lastname',
            type: 'String',
          },
          {
            field: 'fullname',
            type: 'String',
            get: (doc) => `${doc.firstname} ${doc.lastname}`,
          },
          {
            field: 'otherSmartField',
            type: 'String',
            get: (doc) => `${doc.firstname} ${doc.lastname}`,
          },
        ],
      };
      const projectionBuilder = new ProjectionBuilder(schemaWithSmartFields);
      const requestFields = ['fullname', 'firstname'];
      const expectedRequestSmartFields = ['fullname'];
      const actualRequestSmartFields = projectionBuilder.findRequestSmartField(requestFields);
      expect(actualRequestSmartFields).toStrictEqual(expectedRequestSmartFields);
    });
  });
  describe('convertToProjection', () => {
    it('should return a valid projection', () => {
      expect.assertions(1);

      const expectedProjection = { $project: { one: 1, two: 1 } };
      const actualProjection = ProjectionBuilder.convertToProjection(['one', 'two']);

      expect(actualProjection).toStrictEqual(expectedProjection);
    });
  });

  describe('getProjection without requested smart fields', () => {
    it('should returns a valid projection', () => {
      expect.assertions(1);

      const schemaWithSmartFields = {
        fields: [
          {
            field: 'firstname',
            type: 'String',
          },
          {
            field: 'lastname',
            type: 'String',
          },
          {
            field: 'fullname',
            type: 'String',
            get: (doc) => `${doc.firstname} ${doc.lastname}`,
          },
        ],
      };
      const projectionBuilder = new ProjectionBuilder(schemaWithSmartFields);
      const expectedProjection = { $project: { firstname: 1, lastname: 1 } };
      const actualProjection = projectionBuilder.getProjection(['firstname', 'lastname']);

      expect(actualProjection).toStrictEqual(expectedProjection);
    });
  });

  describe('getProjection with requested smart fields', () => {
    it('should returns null', () => {
      expect.assertions(1);

      const schemaWithSmartFields = {
        fields: [
          {
            field: 'firstname',
            type: 'String',
          },
          {
            field: 'lastname',
            type: 'String',
          },
          {
            field: 'fullname',
            type: 'String',
            get: (doc) => `${doc.firstname} ${doc.lastname}`,
          },
        ],
      };
      const projectionBuilder = new ProjectionBuilder(schemaWithSmartFields);
      const expectedProjection = null;
      const actualProjection = projectionBuilder.getProjection(['fullname']);

      expect(actualProjection).toStrictEqual(expectedProjection);
    });
  });
});
