import Interface from 'forest-express';
import Flattener from '../../../src/services/flattener';

const FLATTEN_SEPARATOR = '@@@';

describe('service > Flattener', () => {
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
        const fieldsFlattener = new Flattener({ name: 'cars' }, { });
        fieldsFlattener.validateOptions();

        expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
        expect(errorLoggerSpy).toHaveBeenCalledWith('Could not flatten fields from collection cars, flatten property should be an array.');
      });

      it('should not crash (eg prevent liana initialization)', () => {
        expect.assertions(1);

        jest.resetAllMocks();
        const fieldsFlattener = new Flattener({ name: 'cars' }, { });

        expect(() => { fieldsFlattener.validateOptions(); }).not.toThrow();
      });
    });

    describe('when the field provided is invalid', () => {
      describe('when the field does not exist', () => {
        describe('when the field is of type string', () => {
          let fieldsFlattener;

          beforeAll(() => {
            jest.resetAllMocks();
            fieldsFlattener = new Flattener({ fields: [] }, ['test']);
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
            fieldsFlattener = new Flattener({ fields: [] }, [{ field: 'test' }]);
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
          fieldsFlattener = new Flattener({ fields: [] }, [{ }]);
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
        const fieldsFlattener = new Flattener(generateEngineSchema(), [{ field: 'engine', level: null }]);
        fieldsFlattener.validateOptions();

        expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
        expect(warnLoggerSpy).toHaveBeenCalledWith('Could not parse flatten level for field engine, defaulting to infinite');
      });

      it('should remove the wrong level from flatten configuration', () => {
        expect.assertions(1);

        jest.resetAllMocks();
        const flatten = [{ field: 'engine', level: null }];
        const fieldsFlattener = new Flattener(generateEngineSchema(), flatten);
        fieldsFlattener.validateOptions();

        expect(flatten[0].level).not.toBeDefined();
      });
    });
  });

  describe('flattening a field', () => {
    it(`should merge fields name with ${FLATTEN_SEPARATOR} as separator`, () => {
      expect.assertions(1);

      const schema = generateEngineSchema();

      const fieldsFlattener = new Flattener(schema, ['engine']);
      fieldsFlattener.flattenFields();

      expect(schema.fields[0].field).toStrictEqual(`engine${FLATTEN_SEPARATOR}horsepower`);
    });
  });

  describe('when the level property is empty', () => {
    it('should flatten every nested fields until the end', () => {
      expect.assertions(1);

      const schema = generateEngineSchema();

      const fieldsFlattener = new Flattener(schema, ['engine']);
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
          const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: 100 }]);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(6);
        });
      });
      describe('when the level property is lower than actual level', () => {
        it('should flatten only until specified level', () => {
          expect.assertions(1);

          const schema = generateEngineSchema();
          const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: 1 }]);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(5);
        });
      });
    });
    describe('when the level property is 0', () => {
      it('should flatten only direct child field', () => {
        expect.assertions(1);

        const schema = generateEngineSchema();
        const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: 0 }]);

        fieldsFlattener.flattenFields();

        expect(schema.fields).toHaveLength(4);
      });
    });
    describe('when the level property is under 0', () => {
      it('should not flatten any field', () => {
        expect.assertions(1);

        const schema = generateEngineSchema();
        const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: -2 }]);

        fieldsFlattener.flattenFields();

        expect(schema.fields).toHaveLength(1);
      });
    });
  });

  describe('un-flattening flattened fields', () => {
    it('should correctly un-flatten field', () => {
      expect.assertions(1);

      expect(Flattener.unflattenFieldName(`field${FLATTEN_SEPARATOR}subfield`)).toStrictEqual('field.subfield');
    });
  });

  describe('> middlewares > request-unflattener', () => {
    describe('isFieldFlattened', () => {
      describe('the parameter includes FLATTEN_SEPARATOR', () => {
        it('should return true', () => {
          expect.assertions(1);

          expect(Flattener._isFieldFlattened(`some${FLATTEN_SEPARATOR}flattened${FLATTEN_SEPARATOR}field`)).toBe(true);
        });
      });
      describe('the parameter does not include FLATTEN_SEPARATOR', () => {
        it('should return false', () => {
          expect.assertions(1);

          expect(Flattener._isFieldFlattened('some*other$characters'))
            .toBe(false);
        });
      });
    });

    describe('getParentFieldName', () => {
      describe('the parameter includes FLATTEN_SEPARATOR', () => {
        it('should return the first field name', () => {
          expect.assertions(1);

          expect(Flattener._getParentFieldName(`some${FLATTEN_SEPARATOR}flattened${FLATTEN_SEPARATOR}field`)).toStrictEqual('some');
        });
      });
      describe('the parameter does not include FLATTEN_SEPARATOR', () => {
        it('should return the whole parameter', () => {
          expect.assertions(1);

          expect(Flattener._getParentFieldName('some*other$characters')).toStrictEqual('some*other$characters');
        });
      });
    });

    describe('unflattenCollectionFields', () => {
      it('should return a string of unflattened fields', () => {
        expect.assertions(1);

        expect(
          Flattener._unflattenCollectionFields(`wheelSize,engine${FLATTEN_SEPARATOR}cylinder,engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber,name`),
        ).toStrictEqual('wheelSize,engine,name');
      });
    });

    describe('unflattenFields', () => {
      describe('when fields are empty', () => {
        it('should do nothing', () => {
          expect.assertions(1);
          const request = {
            query: {
              fields: {},
            },
          };

          Flattener._unflattenFields(request);

          expect(request).toStrictEqual({ query: { fields: {} } });
        });
      });
      describe('when fields do not contain any flattened fields', () => {
        it('should do nothing', () => {
          expect.assertions(1);
          const request = {
            query: {
              fields: { cars: 'company,name,engine' },
            },
          };

          Flattener._unflattenFields(request);

          expect(request).toStrictEqual({ query: { fields: { cars: 'company,name,engine' } } });
        });
      });
      describe('when fields contain flattened fields', () => {
        it('should do remove the flattened fields and leave the parent one', () => {
          expect.assertions(1);
          const request = {
            query: {
              fields: {
                cars: `company,name,engine${FLATTEN_SEPARATOR}horsepower,engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber,wheelSize`,
                company: 'name',
              },
            },
          };

          Flattener._unflattenFields(request);

          expect(request).toStrictEqual({ query: { fields: { cars: 'company,name,engine,wheelSize', company: 'name' } } });
        });
      });
    });

    describe('unflattenAttribute', () => {
      const attributeName = `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber`;

      describe('when attribute is flattened', () => {
        it('should unflatten the attribute', () => {
          expect.assertions(2);

          const attributes = {
            [attributeName]: '1234567',
            name: 'Car',
          };
          const {
            parentObjectName,
            unflattenedObject,
          } = Flattener._unflattenAttribute(attributeName, '1234567', attributes);

          expect(parentObjectName).toStrictEqual('engine');
          expect(unflattenedObject).toStrictEqual({
            identification: {
              serialNumber: '1234567',
            },
          });
        });
        describe('when another attribute for the same parent field was already unflattened', () => {
          it('should unflatten the attribute and insert it in the object', () => {
            expect.assertions(2);

            const attributes = {
              engine: { horsePower: '125cv' },
              [attributeName]: '1234567',
              name: 'Car',
            };
            const {
              parentObjectName,
              unflattenedObject,
            } = Flattener._unflattenAttribute(attributeName, '1234567', attributes);

            expect(parentObjectName).toStrictEqual('engine');
            expect(unflattenedObject).toStrictEqual({
              horsePower: '125cv',
              identification: {
                serialNumber: '1234567',
              },
            });
          });
        });
      });
    });

    describe('unflattenAttributes', () => {
      describe('when attributes have flattened fields', () => {
        it('should unflatten the attributes and delete the flattened ones', () => {
          expect.assertions(1);

          const request = {
            body: {
              data: {
                attributes: {
                  [`engine${FLATTEN_SEPARATOR}horsePower`]: '125cv',
                  [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber`]: '1234567',
                  name: 'Car',
                },
              },
            },
          };

          Flattener._unflattenAttributes(request);

          expect(request.body.data.attributes).toStrictEqual({
            engine: {
              horsePower: '125cv',
              identification: {
                serialNumber: '1234567',
              },
            },
            name: 'Car',
          });
        });
      });
    });

    describe('for a GET request', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const request = {
        query: {
          fields: {
            cars: `company,name,engine${FLATTEN_SEPARATOR}horsepower,engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber,wheelSize`,
            company: 'name',
          },
        },
      };

      it('should unflatten the fields in the query', () => {
        expect.assertions(2);
        Flattener.requestUnflattener(request, mockResponse, mockNext);

        expect(request).toStrictEqual({
          query: {
            fields: {
              cars: 'company,name,engine,wheelSize',
              company: 'name',
            },
          },
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('for a POST request', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const request = {
        body: {
          data: {
            attributes: {
              [`engine${FLATTEN_SEPARATOR}horsePower`]: '125cv',
              [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber`]: '1234567',
              name: 'Car',
            },
          },
        },
      };

      it('should unflatten the attributes in the body', () => {
        expect.assertions(2);

        Flattener.requestUnflattener(request, mockResponse, mockNext);

        expect(request).toStrictEqual({
          body: {
            data: {
              attributes: {
                engine: {
                  horsePower: '125cv',
                  identification: {
                    serialNumber: '1234567',
                  },
                },
                name: 'Car',
              },
            },
          },
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('for a bulk delete', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const request = {
        body: {
          data: {
            attributes: {
              all_records_subset_query: {
                'fields[cars]': `_id,company,name,wheelSize,engine${FLATTEN_SEPARATOR}horsePower,engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber`,
                'fields[company]': 'name',
                'page[number]': 1,
                'page[size]': 15,
                sort: '-_id',
                searchExtended: 0,
              },
            },
          },
        },
      };

      it('should unflatten the fields in subset query', () => {
        expect.assertions(2);

        Flattener.requestUnflattener(request, mockResponse, mockNext);

        expect(request).toStrictEqual({
          body: {
            data: {
              attributes: {
                all_records_subset_query: {
                  'fields[cars]': '_id,company,name,wheelSize,engine',
                  'fields[company]': 'name',
                  'page[number]': 1,
                  'page[size]': 15,
                  sort: '-_id',
                  searchExtended: 0,
                },
              },
            },
          },
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('for a belongsTo edit', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const request = {
        query: {
          timezone: 'Europe/Paris',
          context: {
            relationship: 'BelongsTo',
            field: `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`,
            collection: 'cars',
            recordId: '5f928f4f1eedcfbce937bbce',
          },
          fields: { companies: 'name' },
          search: 'Renault',
          searchToEdit: 'true',
        },
      };

      it('should unflatten the field in the context', () => {
        expect.assertions(2);

        Flattener.requestUnflattener(request, mockResponse, mockNext);

        expect(request).toStrictEqual({
          query: {
            timezone: 'Europe/Paris',
            context: {
              relationship: 'BelongsTo',
              field: 'engine.identification.company',
              collection: 'cars',
              recordId: '5f928f4f1eedcfbce937bbce',
            },
            fields: { companies: 'name' },
            search: 'Renault',
            searchToEdit: 'true',
          },
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when splitting on separator', () => {
    it('should split based on the separator FLATTEN_SEPARATOR', () => {
      expect.assertions(4);

      const split = Flattener.splitOnSeparator(`engine${FLATTEN_SEPARATOR}companies`);

      expect(split).toBeArray();
      expect(split).toHaveLength(2);
      expect(split[0]).toStrictEqual('engine');
      expect(split[1]).toStrictEqual('companies');
    });
  });

  describe('unflattenFieldNamesInObject', () => {
    it('should replace the separator in the property names', () => {
      expect.assertions(1);

      const object = {
        [`engine${FLATTEN_SEPARATOR}horsePower`]: '125cv',
        name: 'Car',
        [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`]: 'Renault',
      };
      Flattener.unflattenFieldNamesInObject(object);

      expect(object).toStrictEqual({
        name: 'Car',
        'engine.horsePower': '125cv',
        'engine.identification.manufacturer': 'Renault',
      });
    });
  });

  describe('flattenRecordDataForUpdates', () => {
    it('should return the record if there are no flattened fields', () => {
      expect.assertions(1);

      expect(Flattener.flattenRecordDataForUpdates({ name: 'Car' }, null, []))
        .toStrictEqual({ name: 'Car' });
    });

    it('should flatten the simple type data', () => {
      expect.assertions(1);

      const record = {
        engine: {
          horsePower: '78',
          identification: {
            manufacturer: 'Renault'
              + '',
          },
        },
        name: 'Car',
      };

      const flattenedFields = [
        `engine${FLATTEN_SEPARATOR}horsePower`,
        `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`,
      ];

      const flattenedRecord = Flattener.flattenRecordDataForUpdates(record, null, flattenedFields);

      expect(flattenedRecord).toStrictEqual({
        'engine.horsePower': '78',
        'engine.identification.manufacturer': 'Renault',
        name: 'Car',
      });
    });
  });

  describe('getFlattenedFieldsName', () => {
    it('should return empty array if the fields do not contain flattened fields', () => {
      expect.assertions(1);

      const fields = [
        { field: '_id', type: 'String' },
        { field: 'name', type: 'String' },
      ];

      expect(Flattener.getFlattenedFieldsName(fields)).toHaveLength(0);
    });

    it('should return array of name if fields contain flattened fields', () => {
      expect.assertions(2);

      const fields = [
        { field: '_id', type: 'String' },
        { field: 'name', type: 'String' },
        { field: `engine${FLATTEN_SEPARATOR}horsePower`, type: 'String' },
        { field: `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`, type: 'String' },
      ];

      const result = Flattener.getFlattenedFieldsName(fields);

      expect(result).toHaveLength(2);
      expect(result).toStrictEqual([`engine${FLATTEN_SEPARATOR}horsePower`, `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`]);
    });
  });
});
