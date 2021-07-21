import Interface from 'forest-express';
import FieldsFlattener from '../../../src/services/fields-flattener';

describe('service > fields-flattener', () => {
  let errorLoggerSpy;
  let warnLoggerSpy;

  const generateEngineSchema = () => ({
    name: 'cars',
    fields: [{
      field: 'engine',
      type: {
        fields: [
          { field: 'horsepower', type: 'String' },
          { field: 'cylinder', type: 'Number' },
          {
            field: 'identification',
            type: {
              fields: [
                { field: 'manufacturer', type: 'String' },
                { field: 'serialNumber', type: 'String' },
              ],
            },
          },
          { field: 'company', type: 'String', reference: 'companies._id' },
        ],
      },
    }],
  });


  beforeAll(() => {
    errorLoggerSpy = jest
      .spyOn(Interface.logger, 'error');
    warnLoggerSpy = jest
      .spyOn(Interface.logger, 'warn');
  });

  describe('validating the flatten property', () => {
    describe('when the flatten property is not an array', () => {
      it('should display an error message', () => {
        expect.assertions(2);

        jest.resetAllMocks();
        const fieldsFlattener = new FieldsFlattener({ name: 'cars' }, { });
        fieldsFlattener.validateOptions();

        expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
        expect(errorLoggerSpy).toHaveBeenCalledWith('Could not flatten fields from collection cars, flatten property should be an array.');
      });
    });

    describe('when the field provided is invalid', () => {
      describe('when the field does not exist', () => {
        describe('when the field is of type string', () => {
          it('should display an warning message', () => {
            expect.assertions(2);

            jest.resetAllMocks();
            const fieldsFlattener = new FieldsFlattener({ fields: [] }, ['test']);
            fieldsFlattener.validateOptions();

            expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
            expect(warnLoggerSpy).toHaveBeenCalledWith('Could not flatten field test because it does not exist');
          });

          it('should remove the non existing field from fields to flatten', () => {
            expect.assertions(1);

            const fieldsFlattener = new FieldsFlattener({ fields: [] }, ['test']);
            fieldsFlattener.validateOptions();

            expect(fieldsFlattener.flatten).toHaveLength(0);
          });
        });

        describe('when the field is of type object', () => {
          it('should display a warning message', () => {
            expect.assertions(2);

            jest.resetAllMocks();
            const fieldsFlattener = new FieldsFlattener({ fields: [] }, [{ field: 'test' }]);
            fieldsFlattener.validateOptions();

            expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
            expect(warnLoggerSpy).toHaveBeenCalledWith('Could not flatten field test because it does not exist');
          });

          it('should remove the non existing field from fields to flatten', () => {
            expect.assertions(1);

            const fieldsFlattener = new FieldsFlattener({ fields: [] }, [{ field: 'test' }]);
            fieldsFlattener.validateOptions();

            expect(fieldsFlattener.flatten).toHaveLength(0);
          });
        });
      });

      describe('when a field has not been specified in flatten object', () => {
        it('should display a warning message', () => {
          expect.assertions(2);

          jest.resetAllMocks();
          const fieldsFlattener = new FieldsFlattener({ fields: [] }, [{ }]);
          fieldsFlattener.validateOptions();

          expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
          expect(warnLoggerSpy).toHaveBeenCalledWith(`Could not flatten field with the following configuration ${JSON.stringify({})} because no field has been specified`);
        });

        it('should remove the non existing field from fields to flatten', () => {
          expect.assertions(1);

          const fieldsFlattener = new FieldsFlattener({ fields: [] }, [{ }]);
          fieldsFlattener.validateOptions();

          expect(fieldsFlattener.flatten).toHaveLength(0);
        });
      });
    });
  });

  describe('flattening a field', () => {
    it('should merge fields name with | as separator', () => {
      expect.assertions(1);

      const schema = generateEngineSchema();

      const fieldsFlattener = new FieldsFlattener(schema, ['engine']);
      fieldsFlattener.flattenFields();

      expect(schema.fields[0].field).toContain('|');
    });
  });

  describe('when the level property is empty', () => {
    it('should flatten every nested fields until the end', () => {
      expect.assertions(1);

      const schema = generateEngineSchema();
      const fieldsFlattener = new FieldsFlattener(schema, ['engine']);

      fieldsFlattener.flattenFields();

      expect(schema.fields).toHaveLength(5);
    });
  });

  describe('when the level property is specified', () => {
    describe('when the level property is above 0', () => {
      describe('when the level property is higher than actual level', () => {
        it('should flatten every level until the end', () => {
          expect.assertions(1);

          const schema = generateEngineSchema();
          const fieldsFlattener = new FieldsFlattener(schema, [{ field: 'engine', level: 100 }]);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(5);
        });
      });
      describe('when the level property is lower than actual level', () => {
        it('should flatten only until specified level', () => {
          expect.assertions(1);

          const schema = generateEngineSchema();
          const fieldsFlattener = new FieldsFlattener(schema, [{ field: 'engine', level: 0 }]);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(4);
        });
      });
    });
    describe('when the level property is 0', () => {
      it('should flatten only direct child field', () => {
        expect.assertions(1);

        const schema = generateEngineSchema();
        const fieldsFlattener = new FieldsFlattener(schema, [{ field: 'engine', level: 0 }]);

        fieldsFlattener.flattenFields();

        expect(schema.fields).toHaveLength(4);
      });
    });
    describe('when the level property is under 0', () => {
      it('should not flatten any field', () => {
        expect.assertions(1);

        const schema = generateEngineSchema();
        const fieldsFlattener = new FieldsFlattener(schema, [{ field: 'engine', level: -2 }]);

        fieldsFlattener.flattenFields();

        expect(schema.fields).toHaveLength(1);
      });
    });
  });
});
