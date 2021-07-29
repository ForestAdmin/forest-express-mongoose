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
                {
                  field: 'serialNumber',
                  type: {
                    fields: [
                      { field: 'number', type: 'String' },
                      { field: 'position', type: 'String' },
                    ],
                  },
                },
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

      it('should not crash (eg prevent liana initialization)', () => {
        expect.assertions(1);

        jest.resetAllMocks();
        const fieldsFlattener = new FieldsFlattener({ name: 'cars' }, { });

        expect(() => { fieldsFlattener.validateOptions(); }).not.toThrow();
      });
    });

    describe('when the field provided is invalid', () => {
      describe('when the field does not exist', () => {
        describe('when the field is of type string', () => {
          let fieldsFlattener;

          beforeAll(() => {
            jest.resetAllMocks();
            fieldsFlattener = new FieldsFlattener({ fields: [] }, ['test']);
            fieldsFlattener.validateOptions();
          });

          it('should display an warning message', () => {
            expect.assertions(2);

            expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
            expect(warnLoggerSpy).toHaveBeenCalledWith('Could not flatten field test because it does not exist');
          });

          it('should remove the non existing field from fields to flatten', () => {
            expect.assertions(1);

            expect(fieldsFlattener.flatten).toHaveLength(0);
          });
        });

        describe('when the field is of type object', () => {
          let fieldsFlattener;

          beforeAll(() => {
            jest.resetAllMocks();
            fieldsFlattener = new FieldsFlattener({ fields: [] }, [{ field: 'test' }]);
            fieldsFlattener.validateOptions();
          });

          it('should display a warning message', () => {
            expect.assertions(2);

            expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
            expect(warnLoggerSpy).toHaveBeenCalledWith('Could not flatten field test because it does not exist');
          });

          it('should remove the non existing field from fields to flatten', () => {
            expect.assertions(1);

            expect(fieldsFlattener.flatten).toHaveLength(0);
          });
        });
      });

      describe('when a field has not been specified in flatten object', () => {
        let fieldsFlattener;

        beforeAll(() => {
          jest.resetAllMocks();
          fieldsFlattener = new FieldsFlattener({ fields: [] }, [{ }]);
          fieldsFlattener.validateOptions();
        });

        it('should display a warning message', () => {
          expect.assertions(2);

          expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
          expect(warnLoggerSpy).toHaveBeenCalledWith(`Could not flatten field with the following configuration ${JSON.stringify({})} because no field has been specified`);
        });

        it('should remove the non existing field from fields to flatten', () => {
          expect.assertions(1);

          expect(fieldsFlattener.flatten).toHaveLength(0);
        });
      });
    });

    describe('when the level property is not a number', () => {
      it('should display a warning message stating that all levels will be flatten', () => {
        expect.assertions(2);

        jest.resetAllMocks();
        const fieldsFlattener = new FieldsFlattener(generateEngineSchema(), [{ field: 'engine', level: null }]);
        fieldsFlattener.validateOptions();

        expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
        expect(warnLoggerSpy).toHaveBeenCalledWith('Could not parse flatten level for field engine, defaulting to infinite');
      });

      it('should remove the wrong level from flatten configuration', () => {
        expect.assertions(1);

        jest.resetAllMocks();
        const flatten = [{ field: 'engine', level: null }];
        const fieldsFlattener = new FieldsFlattener(generateEngineSchema(), flatten);
        fieldsFlattener.validateOptions();

        expect(flatten[0].level).not.toBeDefined();
      });
    });
  });

  describe('flattening a field', () => {
    it('should merge fields name with | as separator', () => {
      expect.assertions(1);

      const schema = generateEngineSchema();

      const fieldsFlattener = new FieldsFlattener(schema, ['engine']);
      fieldsFlattener.flattenFields();

      expect(schema.fields[0].field).toStrictEqual('engine|horsepower');
    });
  });

  describe('when the level property is empty', () => {
    it('should flatten every nested fields until the end', () => {
      expect.assertions(1);

      const schema = generateEngineSchema();

      const fieldsFlattener = new FieldsFlattener(schema, ['engine']);
      fieldsFlattener.flattenFields();

      expect(schema.fields).toHaveLength(6);
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

          expect(schema.fields).toHaveLength(6);
        });
      });
      describe('when the level property is lower than actual level', () => {
        it('should flatten only until specified level', () => {
          expect.assertions(1);

          const schema = generateEngineSchema();
          const fieldsFlattener = new FieldsFlattener(schema, [{ field: 'engine', level: 1 }]);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(5);
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

  describe('un-flattening flattened fields', () => {
    it('should correctly un-flatten field', () => {
      expect.assertions(1);

      expect(FieldsFlattener.unflattenFieldName('field|subfield')).toStrictEqual('field.subfield');
    });
  });
});
