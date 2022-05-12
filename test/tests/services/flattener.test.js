import Interface from 'forest-express';
import mongoose from 'mongoose';
import Flattener from '../../../src/services/flattener';
import mongooseConnect from '../../utils/mongoose-connect';

const FLATTEN_SEPARATOR = '@@@';

describe('service > Flattener', () => {
  let errorLoggerSpy;
  let warnLoggerSpy;

  const companiesSchema = mongoose.Schema({
    name: String,
  });
  const carsSchema = mongoose.Schema({
    name: String,
    engine: {
      horsePower: { type: String, default: '110cv', enum: ['110cv', '115cv', '130cv'] },
      identification: {
        manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'companies' },
      },
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'companies' },
      partners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'companies' }],
    },
  });
  let carsModel;
  const generateFlattenedEngineSchema = () => ({
    name: 'cars',
    fields: [{
      field: 'name',
      type: 'String',
      defaultValue: null,
      enums: null,
      integration: null,
      isFilterable: true,
      isPrimaryKey: false,
      isReadOnly: false,
      isRequired: false,
      isSortable: true,
      isVirtual: false,
      reference: null,
      inverseOf: null,
      validations: [],
    }, {
      field: 'engine@@@horsePower',
      type: 'String',
      defaultValue: null,
      enums: null,
      integration: null,
      isFilterable: true,
      isPrimaryKey: false,
      isReadOnly: false,
      isRequired: false,
      isSortable: true,
      isVirtual: false,
      reference: null,
      inverseOf: null,
      validations: [],
    }, {
      field: 'engine@@@identification@@@manufacturer',
      type: 'String',
      defaultValue: null,
      enums: null,
      integration: null,
      isFilterable: true,
      isPrimaryKey: false,
      isReadOnly: false,
      isRequired: false,
      isSortable: true,
      isVirtual: false,
      reference: 'companies._id',
      inverseOf: null,
      validations: [],
    }, {
      field: 'engine@@@owner',
      type: 'String',
      defaultValue: null,
      enums: null,
      integration: null,
      isFilterable: true,
      isPrimaryKey: false,
      isReadOnly: false,
      isRequired: false,
      isSortable: true,
      isVirtual: false,
      reference: 'companies._id',
      inverseOf: null,
      validations: [],
    }, {
      field: 'engine@@@partners',
      type: ['String'],
      defaultValue: null,
      enums: null,
      integration: null,
      isFilterable: true,
      isPrimaryKey: false,
      isReadOnly: false,
      isRequired: false,
      isSortable: true,
      isVirtual: false,
      reference: 'companies._id',
      inverseOf: null,
      validations: [],
    }],
  });
  const generateDefaultEngineSchema = () => ({
    name: 'cars',
    fields: [{
      field: 'engine',
      type: {
        fields: [
          { field: 'owner', type: 'String', reference: 'companies._id' },
          { field: 'horsePower', type: 'String' },
          {
            field: 'identification',
            type: {
              fields: [
                { field: 'manufacturer', type: 'String', reference: 'companies._id' },
              ],
            },
          },
          { field: 'partners', type: ['String'], reference: 'companies._id' },
        ],
      },
    }, {
      field: 'name',
      type: 'String',
    }],
  });
  const lianaOptions = {
    connections: {},
    mongoose,
  };

  beforeAll(async () => {
    Interface.Schemas.schemas.cars = {
      fields: [],
    };
    errorLoggerSpy = jest
      .spyOn(Interface.logger, 'error');
    warnLoggerSpy = jest
      .spyOn(Interface.logger, 'warn');

    await mongooseConnect();

    lianaOptions.connections.default = mongoose.connection;
    mongoose.model('cars', carsSchema);
    mongoose.model('companies', companiesSchema);
    carsModel = lianaOptions.connections.default.models.cars;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('unflattenParams', () => {
    const fieldParams = {
      fields: {
        cars: '_id,name,engine@@@owner,engine@@@identification@@@manufacturer,engine@@@horsePower',
      },
    };

    it('should return a copy of the params', () => {
      expect.assertions(1);

      const unflattenedParams = Flattener.unflattenParams(fieldParams);

      expect(unflattenedParams).not.toBe(fieldParams);
    });

    it('should not update unflattened fields', () => {
      expect.assertions(2);

      const unflattenedParams = Flattener.unflattenParams(fieldParams);

      expect(unflattenedParams.fields.cars).toContain('_id');
      expect(unflattenedParams.fields.cars).toContain('name');
    });

    it('should regroup flattened fields to their unflattened one', () => {
      expect.assertions(4);

      const unflattenedParams = Flattener.unflattenParams(fieldParams);

      expect(unflattenedParams.fields.cars).toContain('engine');
      expect(unflattenedParams.fields.cars).not.toContain('engine@@@owner');
      expect(unflattenedParams.fields.cars).not.toContain('engine@@@identification@@@manufacturer');
      expect(unflattenedParams.fields.cars).not.toContain('engine@@@horsePower');
    });
  });

  describe('validating the flatten property', () => {
    describe('when the flatten property is not an array', () => {
      it('should display an error message', () => {
        expect.assertions(2);

        jest.resetAllMocks();
        const fieldsFlattener = new Flattener({ name: 'cars' }, { }, carsModel, lianaOptions);
        fieldsFlattener.validateOptions();

        expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
        expect(errorLoggerSpy).toHaveBeenCalledWith('Could not flatten fields from collection cars, flatten property should be an array.');
      });

      it('should not crash (eg prevent liana initialization)', () => {
        expect.assertions(1);

        jest.resetAllMocks();
        const fieldsFlattener = new Flattener({ name: 'cars' }, { }, carsModel, lianaOptions);

        expect(() => { fieldsFlattener.validateOptions(); }).not.toThrow();
      });
    });

    describe('when the field provided is invalid', () => {
      describe('when the field does not exist', () => {
        describe('when the field is of type string', () => {
          let fieldsFlattener;

          beforeAll(() => {
            jest.resetAllMocks();
            fieldsFlattener = new Flattener({ fields: [] }, ['test'], carsModel, lianaOptions);
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
            fieldsFlattener = new Flattener({ fields: [] }, [{ field: 'test' }], carsModel, lianaOptions);
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
          fieldsFlattener = new Flattener({ fields: [] }, [{ }], carsModel, lianaOptions);
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
        const fieldsFlattener = new Flattener(
          generateDefaultEngineSchema(),
          [{ field: 'engine', level: null }],
          carsModel,
          lianaOptions,
        );
        fieldsFlattener.validateOptions();

        expect(warnLoggerSpy).toHaveBeenCalledTimes(1);
        expect(warnLoggerSpy).toHaveBeenCalledWith('Could not parse flatten level for field engine, defaulting to infinite');
      });

      it('should remove the wrong level from flatten configuration', () => {
        expect.assertions(1);

        jest.resetAllMocks();
        const flatten = [{ field: 'engine', level: null }];
        const fieldsFlattener = new Flattener(
          generateDefaultEngineSchema(),
          flatten,
          carsModel,
          lianaOptions,
        );
        fieldsFlattener.validateOptions();

        expect(flatten[0].level).not.toBeDefined();
      });
    });
  });

  describe('flattening a field', () => {
    it('should deeply introspect mongoose schema for native fields', () => {
      expect.assertions(2);

      const schema = generateDefaultEngineSchema();

      const fieldsFlattener = new Flattener(schema, ['engine'], carsModel, lianaOptions);
      fieldsFlattener.flattenFields();

      const horsePowerField = schema.fields
        .find((field) => field.field === 'engine@@@horsePower');

      expect(horsePowerField.defaultValue).toStrictEqual('110cv');
      expect(horsePowerField.enums).toStrictEqual(['110cv', '115cv', '130cv']);
    });

    it(`should merge fields name with ${FLATTEN_SEPARATOR} as separator`, () => {
      expect.assertions(1);

      const schema = generateDefaultEngineSchema();

      const fieldsFlattener = new Flattener(schema, ['engine'], carsModel, lianaOptions);
      fieldsFlattener.flattenFields();

      expect(schema.fields).toContainEqual({
        field: `engine${FLATTEN_SEPARATOR}owner`,
        type: 'String',
        reference: 'companies._id',
      });
    });
  });

  describe('when the level property is empty', () => {
    it('should flatten every nested fields until the end', () => {
      expect.assertions(1);

      const schema = generateDefaultEngineSchema();

      const fieldsFlattener = new Flattener(schema, ['engine'], carsModel, lianaOptions);
      fieldsFlattener.flattenFields();

      expect(schema.fields).toHaveLength(5);
    });
  });

  describe('when the level property is specified', () => {
    describe('when the level property is above 0', () => {
      describe('when the level property is higher than actual level', () => {
        it('should flatten every level until the end', () => {
          expect.assertions(1);

          const schema = generateDefaultEngineSchema();
          const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: 100 }], carsModel, lianaOptions);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(5);
        });
      });
      describe('when the level property is lower than actual level', () => {
        it('should flatten only until specified level', () => {
          expect.assertions(1);

          const schema = generateDefaultEngineSchema();
          const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: 0 }], carsModel, lianaOptions);

          fieldsFlattener.flattenFields();

          expect(schema.fields).toHaveLength(5);
        });
      });
    });
    describe('when the level property is 0', () => {
      it('should flatten only direct child field', () => {
        expect.assertions(1);

        const schema = generateDefaultEngineSchema();
        const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: 0 }], carsModel, lianaOptions);

        fieldsFlattener.flattenFields();

        expect(schema.fields).toHaveLength(5);
      });
    });
    describe('when the level property is under 0', () => {
      it('should not flatten any field', () => {
        expect.assertions(1);

        const schema = generateDefaultEngineSchema();
        const fieldsFlattener = new Flattener(schema, [{ field: 'engine', level: -2 }], carsModel, lianaOptions);

        fieldsFlattener.flattenFields();

        expect(schema.fields).toHaveLength(2);
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
        originalUrl: 'http://localhost:3311/forest/cars',
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

        expect(request.query).toStrictEqual({
          fields: {
            cars: 'company,name,engine,wheelSize',
            company: 'name',
          },
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('for a POST request', () => {
      const setupTest = () => ({
        mockResponse: {},
        mockNext: jest.fn(),
        request: {
          originalUrl: 'http://localhost:3311/forest/cars',
          body: {
            data: {
              attributes: {
                [`engine${FLATTEN_SEPARATOR}horsePower`]: '125cv',
                [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}serialNumber`]: '1234567',
                name: 'Car',
              },
              relationships: {
                [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`]: {
                  data: {
                    type: 'companies',
                    id: '5fd78361f8e514b2abe7044b',
                  },
                },
                company: {
                  data: {
                    type: 'companies',
                    id: '5fd78361f8e514b2abe7044b',
                  },
                },
              },
            },
            type: 'cars',
          },
        },
      });

      it('should unflatten the attributes in the body', () => {
        expect.assertions(2);

        const { request, mockResponse, mockNext } = setupTest();

        Flattener.requestUnflattener(request, mockResponse, mockNext);

        const { attributes } = request.body.data;

        expect(attributes).toStrictEqual({
          engine: {
            horsePower: '125cv',
            identification: {
              company: '5fd78361f8e514b2abe7044b',
              serialNumber: '1234567',
            },
          },
          name: 'Car',
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });

      describe('handling relationships', () => {
        it('should not change the request if no relationship exits', () => {
          expect.assertions(2);

          const relationshipUnWrapperSpy = jest.spyOn(Flattener, '_unwrapFlattenedReferences');
          const {
            request,
            mockResponse,
            mockNext,
          } = setupTest();

          request.body.data.relationships = {};
          const originalRequest = Object.assign(request);

          Flattener.requestUnflattener(request, mockResponse, mockNext);

          expect(originalRequest).toStrictEqual(request);
          expect(relationshipUnWrapperSpy).not.toHaveBeenCalled();

          relationshipUnWrapperSpy.mockClear();
        });

        it('should not change the request if relationships are not flattened ones', () => {
          expect.assertions(2);

          const relationshipUnWrapperSpy = jest.spyOn(Flattener, '_unwrapFlattenedReferences');
          const {
            request,
            mockResponse,
            mockNext,
          } = setupTest();

          delete request.body.data.relationships[`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`];
          const originalRequest = Object.assign(request);

          Flattener.requestUnflattener(request, mockResponse, mockNext);

          expect(originalRequest).toStrictEqual(request);
          expect(relationshipUnWrapperSpy).toHaveBeenCalledTimes(1);

          relationshipUnWrapperSpy.mockClear();
        });

        it('should move flattened relationships in the original attribute', () => {
          expect.assertions(4);

          const {
            request,
            mockResponse,
            mockNext,
          } = setupTest();

          Flattener.requestUnflattener(request, mockResponse, mockNext);

          const { attributes, relationships } = request.body.data;

          expect(attributes.engine.identification.company).toStrictEqual('5fd78361f8e514b2abe7044b');
          expect(relationships[`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`]).toBeUndefined();
          expect(relationships).toStrictEqual({
            company: {
              data: {
                type: 'companies',
                id: '5fd78361f8e514b2abe7044b',
              },
            },
          });
          expect(mockNext).toHaveBeenCalledTimes(1);
        });

        it('should correctly unwrap relationship even if original object is not present', () => {
          expect.assertions(2);

          const {
            request,
            mockResponse,
            mockNext,
          } = setupTest();

          request.body.data.attributes = {
            name: 'Car',
          };

          Flattener.requestUnflattener(request, mockResponse, mockNext);

          const { attributes, relationships } = request.body.data;

          expect(attributes.engine.identification.company).toStrictEqual('5fd78361f8e514b2abe7044b');
          expect(relationships[`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`]).toBeUndefined();
        });

        it('should correctly unwrap relationship even if no attributes has been set', () => {
          expect.assertions(2);

          const {
            request,
            mockResponse,
            mockNext,
          } = setupTest();

          request.body.data.attributes = undefined;

          Flattener.requestUnflattener(request, mockResponse, mockNext);

          const { attributes, relationships } = request.body.data;

          expect(attributes.engine.identification.company).toStrictEqual('5fd78361f8e514b2abe7044b');
          expect(relationships[`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`]).toBeUndefined();
        });
      });
    });

    describe('for a bulk delete', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const request = {
        originalUrl: 'http://localhost:3311/forest/cars',
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

        expect(request.body).toStrictEqual({
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
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('for a belongsTo edit', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const fieldEdited = `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}company`;
      const request = {
        originalUrl: `http://localhost:3311/forest/cars/1/${fieldEdited}`,
        query: {
          timezone: 'Europe/Paris',
          context: {
            relationship: 'BelongsTo',
            field: fieldEdited,
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

        expect(request.query).toStrictEqual({
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
        });
        expect(mockNext).toHaveBeenCalledTimes(1);
      });
    });

    describe('for a csv export request', () => {
      const mockResponse = {};
      const mockNext = jest.fn();
      const request = {
        originalUrl: 'http://localhost:3311/forest/cars.csv?',
        query: {
          timezone: 'Europe/Paris',
          filename: 'cars',
          header: 'id,engine->horse power,engine->owner',
          fields: { cars: '_id,engine@@@horsePower,engine@@@owner' },
        },
      };

      it('should not touch the request', () => {
        expect.assertions(2);

        Flattener.requestUnflattener(request, mockResponse, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(request.query).toStrictEqual({
          timezone: 'Europe/Paris',
          filename: 'cars',
          header: 'id,engine->horse power,engine->owner',
          fields: { cars: '_id,engine@@@horsePower,engine@@@owner' },
        });
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
            manufacturer: 'Renault',
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

    it('should correctly set values to null', () => {
      expect.assertions(1);

      const record = {
        engine: {
          horsePower: '78',
          identification: {
            manufacturer: null,
          },
        },
        name: null,
      };

      const flattenedFields = [
        `engine${FLATTEN_SEPARATOR}horsePower`,
        `engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`,
      ];

      const flattenedRecord = Flattener.flattenRecordDataForUpdates(record, null, flattenedFields);

      expect(flattenedRecord).toStrictEqual({
        'engine.horsePower': '78',
        'engine.identification.manufacturer': null,
        name: null,
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

  describe('getFlattenedReferenceFieldsFromFieldNames', () => {
    beforeEach(() => {
      Interface.Schemas.schemas.cars = generateFlattenedEngineSchema();
    });

    describe('when no fields are actually present on the collection', () => {
      it('should return an empty array', () => {
        expect.assertions(1);

        Interface.Schemas.schemas.cars.fields = [];

        const referenceNestedFields = Flattener
          .getFlattenedReferenceFieldsFromParams('cars', {});

        expect(referenceNestedFields).toStrictEqual([]);
      });
    });

    describe('when no references has been requested in the fields', () => {
      it('should return an empty array', () => {
        expect.assertions(1);

        const fields = {
          cars: ['name'],
        };

        const referenceNestedFields = Flattener
          .getFlattenedReferenceFieldsFromParams('cars', fields);

        expect(referenceNestedFields).toStrictEqual([]);
      });
    });

    describe('when requested reference is not part of the collection', () => {
      it('should not include the wrong reference', () => {
        expect.assertions(1);

        const fields = {
          cars: ['name'],
          'cars@@@notexisting': ['name'],
        };

        const referenceNestedFields = Flattener
          .getFlattenedReferenceFieldsFromParams('cars', fields);

        expect(referenceNestedFields).toStrictEqual([]);
      });
    });

    describe('when requested references belongs to the collection', () => {
      it('should include the references', () => {
        expect.assertions(1);

        const fields = {
          cars: ['name'],
          'engine@@@identification@@@manufacturer': ['name'],
          'engine@@@owner': ['name'],
        };

        const referenceNestedFields = Flattener
          .getFlattenedReferenceFieldsFromParams('cars', fields);

        expect(referenceNestedFields).toStrictEqual([
          'engine@@@identification@@@manufacturer',
          'engine@@@owner',
        ]);
      });
    });

    describe('when requested references are actually not references', () => {
      it('should not include non reference fields', () => {
        expect.assertions(1);

        const fields = {
          cars: ['name'],
          'engine@@@horsePower': ['name'],
          'engine@@@owner': ['name'],
        };

        const referenceNestedFields = Flattener
          .getFlattenedReferenceFieldsFromParams('cars', fields);

        expect(referenceNestedFields).toStrictEqual(['engine@@@owner']);
      });
    });
  });

  describe('generateNestedPathsFromModelName', () => {
    beforeEach(() => {
      Interface.Schemas.schemas.cars = generateFlattenedEngineSchema();
    });

    describe('when no modelName is passed', () => {
      it('should return an empty array', () => {
        expect.assertions(1);

        const nestedPaths = Flattener.generateNestedPathsFromModelName(undefined);

        expect(nestedPaths).toStrictEqual([]);
      });
    });

    describe('when no fields have been defined', () => {
      it('should return an empty array', () => {
        expect.assertions(1);

        Interface.Schemas.schemas.cars.fields = [];

        const nestedPaths = Flattener.generateNestedPathsFromModelName('cars');

        expect(nestedPaths).toStrictEqual([]);
      });
    });

    describe('when no fields have been flattened', () => {
      it('should return an empty array', () => {
        expect.assertions(1);

        Interface.Schemas.schemas.cars = generateDefaultEngineSchema();

        const nestedPaths = Flattener.generateNestedPathsFromModelName('cars');

        expect(nestedPaths).toStrictEqual([]);
      });
    });

    describe('when some fields have been flattened', () => {
      it('should return an array of nestedPaths from flattened fields', () => {
        expect.assertions(1);

        const nestedPaths = Flattener.generateNestedPathsFromModelName('cars');

        expect(nestedPaths).toStrictEqual([
          ['engine', 'horsePower'],
          ['engine', 'identification', 'manufacturer'],
          ['engine', 'owner'],
          ['engine', 'partners'],
        ]);
      });
    });
  });

  describe('flattenRecordsForExport', () => {
    let sampleCar;

    beforeEach(() => {
      Interface.Schemas.schemas.cars = generateFlattenedEngineSchema();
      sampleCar = {
        name: 'Golf',
        engine: {
          identification: {
            manufacturer: '5fd78361f8e514b2abe7044b',
          },
          owner: '5f928f4f1eedcfbce937bbce',
          partners: [
            '5f928f4f1eedcfbce937bbce',
            '5fd78361f8e514b2abe7044b',
          ],
          horsePower: '110cv',
        },
      };
    });

    describe('when no fields have been flattened', () => {
      it('should not change the record', () => {
        expect.assertions(1);

        Interface.Schemas.schemas.cars = generateDefaultEngineSchema();

        Flattener.flattenRecordsForExport('cars', [sampleCar]);

        expect(sampleCar).toStrictEqual({
          name: 'Golf',
          engine: {
            identification: {
              manufacturer: '5fd78361f8e514b2abe7044b',
            },
            owner: '5f928f4f1eedcfbce937bbce',
            partners: [
              '5f928f4f1eedcfbce937bbce',
              '5fd78361f8e514b2abe7044b',
            ],
            horsePower: '110cv',
          },
        });
      });
    });

    describe('when some fields have been flattened', () => {
      it('should flatten the flattened fields', () => {
        expect.assertions(3);

        Flattener.flattenRecordsForExport('cars', [sampleCar]);

        expect(sampleCar['engine@@@owner']).toStrictEqual('5f928f4f1eedcfbce937bbce');
        expect(sampleCar['engine@@@horsePower']).toStrictEqual('110cv');
        expect(sampleCar['engine@@@identification@@@manufacturer']).toStrictEqual('5fd78361f8e514b2abe7044b');
      });

      it('should not change non flattened fields', () => {
        expect.assertions(1);

        Flattener.flattenRecordsForExport('cars', [sampleCar]);

        expect(sampleCar.name).toStrictEqual('Golf');
      });

      it('should clean the initial attribute which have been flattened', () => {
        expect.assertions(1);

        Flattener.flattenRecordsForExport('cars', [sampleCar]);

        expect(sampleCar.engine).toBeUndefined();
      });
    });
  });
});
