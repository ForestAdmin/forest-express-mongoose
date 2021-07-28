const requestUnflattener = require('../../../src/middlewares/request-unflattener');


describe('middlewares > request-unflattener', () => {
  describe('isFieldFlattened', () => {
    describe('the parameter includes |', () => {
      it('should return true', () => {
        expect.assertions(1);

        expect(requestUnflattener.isFieldFlattened('some|flattened|field')).toBe(true);
      });
    });
    describe('the parameter does not include |', () => {
      it('should return false', () => {
        expect.assertions(1);

        expect(requestUnflattener.isFieldFlattened('some*other$characters'))
          .toBe(false);
      });
    });
  });

  describe('getParentFieldName', () => {
    describe('the parameter includes |', () => {
      it('should return the first field name', () => {
        expect.assertions(1);

        expect(requestUnflattener.getParentFieldName('some|flattened|field')).toStrictEqual('some');
      });
    });
    describe('the parameter does not include |', () => {
      it('should return the whole parameter', () => {
        expect.assertions(1);

        expect(requestUnflattener.getParentFieldName('some*other$characters')).toStrictEqual('some*other$characters');
      });
    });
  });

  describe('unflattenCollectionFields', () => {
    it('should return a string of unflattened fields', () => {
      expect.assertions(1);

      expect(
        requestUnflattener.unflattenCollectionFields('wheelSize,engine|cylinder,engine|identification|serialNumber,name'),
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

        requestUnflattener.unflattenFields(request);

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

        requestUnflattener.unflattenFields(request);

        expect(request).toStrictEqual({ query: { fields: { cars: 'company,name,engine' } } });
      });
    });
    describe('when fields contain flattened fields', () => {
      it('should do remove the flattened fields and leave the parent one', () => {
        expect.assertions(1);
        const request = {
          query: {
            fields: {
              cars: 'company,name,engine|horsepower,engine|identification|serialNumber,wheelSize',
              company: 'name',
            },
          },
        };

        requestUnflattener.unflattenFields(request);

        expect(request).toStrictEqual({ query: { fields: { cars: 'company,name,engine,wheelSize', company: 'name' } } });
      });
    });
  });

  describe('unflattenAttribute', () => {
    describe('when attribute is flattened', () => {
      it('should unflatted the attribute', () => {
        expect.assertions(2);

        const attributes = {
          'engine|identification|serialNumber': '1234567',
          name: 'Car',
        };
        const {
          parentObjectName,
          unflattenedObject,
        } = requestUnflattener.unflattenAttribute('engine|identification|serialNumber', '1234567', attributes);

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
            'engine|identification|serialNumber': '1234567',
            name: 'Car',
          };
          const {
            parentObjectName,
            unflattenedObject,
          } = requestUnflattener.unflattenAttribute('engine|identification|serialNumber', '1234567', attributes);

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
                'engine|horsePower': '125cv',
                'engine|identification|serialNumber': '1234567',
                name: 'Car',
              },
            },
          },
        };

        requestUnflattener.unflattenAttributes(request);

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
          cars: 'company,name,engine|horsepower,engine|identification|serialNumber,wheelSize',
          company: 'name',
        },
      },
    };

    it('should unflatten the fields in the query', () => {
      expect.assertions(2);
      requestUnflattener(request, mockResponse, mockNext);

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
            'engine|horsePower': '125cv',
            'engine|identification|serialNumber': '1234567',
            name: 'Car',
          },
        },
      },
    };

    it('should unflatten the attributes in the body', () => {
      expect.assertions(2);

      requestUnflattener(request, mockResponse, mockNext);

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
              'fields[cars]': '_id,company,name,wheelSize,engine|horsePower,engine|identification|serialNumber',
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

      requestUnflattener(request, mockResponse, mockNext);

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
});
