import ProjectionBuilder from '../../../src/services/projection-builder';

describe('service > projection-builder', () => {
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
    it('should returns referenced fields in projection', () => {
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
      const actualProjection = projectionBuilder.getProjection(['fullname']);

      expect(actualProjection).toStrictEqual(expectedProjection);
    });
  });

  describe('getReferencedFields', () => {
    it('should returns referenced fields in string concatenation', () => {
      expect.assertions(1);

      const testedFunction = (doc) => `${doc.firstname} ${doc.lastname}`;

      const actualReferencedFields = ProjectionBuilder.getReferencedFields(testedFunction);
      const expectedReferencedFields = ['firstname', 'lastname'];

      expect(actualReferencedFields).toStrictEqual(expectedReferencedFields);
    });

    it('should returns referenced fields in a simple function', () => {
      expect.assertions(1);

      function testedFunction(doc) {
        // eslint-disable-next-line
        return doc.firstname + ' ' + doc.lastname;
      }

      const actualReferencedFields = ProjectionBuilder.getReferencedFields(testedFunction);
      const expectedReferencedFields = ['firstname', 'lastname'];

      expect(actualReferencedFields).toStrictEqual(expectedReferencedFields);
    });

    it('should returns referenced fields in async function', () => {
      expect.assertions(1);

      /* eslint-disable */
      async function testedFunction(doc) {
        return await new Promise((resolve) => {
          resolve(doc.firstname + ' ' + doc.lastname);
        });
      }
      /* eslint-enable */

      const actualReferencedFields = ProjectionBuilder.getReferencedFields(testedFunction);
      const expectedReferencedFields = ['firstname', 'lastname'];

      expect(actualReferencedFields).toStrictEqual(expectedReferencedFields);
    });

    it('should returns referenced fields in spread operator', () => {
      expect.assertions(1);

      const testedFunction = ({ firstname, lastname }) => `${firstname} ${lastname}`;

      const actualReferencedFields = ProjectionBuilder.getReferencedFields(testedFunction);
      const expectedReferencedFields = ['firstname', 'lastname'];

      expect(actualReferencedFields).toStrictEqual(expectedReferencedFields);
    });

    it('should returns referenced fields in spread operator with rest', () => {
      expect.assertions(1);

      const testedFunction = ({ firstname, ...rest }) => `${firstname} ${rest.lastname}`;

      const actualReferencedFields = ProjectionBuilder.getReferencedFields(testedFunction);
      const expectedReferencedFields = ['firstname', 'lastname'];

      expect(actualReferencedFields).toStrictEqual(expectedReferencedFields);
    });
  });
});
