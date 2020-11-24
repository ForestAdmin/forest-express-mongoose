jest.mock('forest-express', () => ({
  init: jest.fn(),
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
const forestExpressMock = require('forest-express');

jest.mock('../../package.json');
const packageJsonMock = require('../../package.json');

const forestExpressMongoose = require('../../src');

describe('forest-express-mongoose > init', () => {
  const mockPackageJsonVersion = (version) => {
    packageJsonMock.version = version;
  };

  const createForestExpressInitSpy = (implementation) => {
    jest.resetAllMocks();
    const spy = jest.spyOn(forestExpressMock, 'init');
    spy.mockImplementation(implementation);
  };

  const initForestExpressMongoose = (options) =>
    forestExpressMongoose.init({
      objectMapping: {},
      connections: {},
      ...options,
    });

  describe('when the given configuration is correct', () => {
    it('should call forest-express init function', () => {
      expect.assertions(2);

      jest.resetAllMocks();
      initForestExpressMongoose();

      expect(forestExpressMock.init).toHaveBeenCalledTimes(1);
      expect(forestExpressMock.init).toHaveBeenCalledWith(expect.any(Object));
    });

    describe('when forest-express init is called with exports', () => {
      it('should contains an instance of objectMapping and connections options', () => {
        expect.assertions(2);

        createForestExpressInitSpy(({ opts }) => {
          expect(opts).toHaveProperty('Mongoose');
          expect(opts).toHaveProperty('connections');
        });

        initForestExpressMongoose();
      });

      describe('should contains a function getLianaName', () => {
        it('should return "forest-express-mongoose"', () => {
          expect.assertions(2);

          createForestExpressInitSpy((exports) => {
            expect(exports.getLianaName).toStrictEqual(expect.any(Function));
            expect(exports.getLianaName()).toStrictEqual('forest-express-mongoose');
          });

          initForestExpressMongoose();
        });
      });

      describe('should contains a function getLianaVersion', () => {
        it('should return null if bad version is provided', () => {
          expect.assertions(2);

          mockPackageJsonVersion('a bad version');

          createForestExpressInitSpy((exports) => {
            expect(exports.getLianaVersion).toStrictEqual(expect.any(Function));
            expect(exports.getLianaVersion()).toBeNull();
          });

          initForestExpressMongoose();
        });

        it('should return the liana version', () => {
          expect.assertions(2);

          const LIANA_VERSION = '1.0.0';

          mockPackageJsonVersion(LIANA_VERSION);

          createForestExpressInitSpy((exports) => {
            expect(exports.getLianaVersion).toStrictEqual(expect.any(Function));
            expect(exports.getLianaVersion()).toStrictEqual(LIANA_VERSION);
          });

          initForestExpressMongoose();
        });
      });

      describe('should contains a function getOrmVersion', () => {
        it('should return objectMapping version', () => {
          expect.assertions(2);

          const OMV = '1.0.0';

          createForestExpressInitSpy((exports) => {
            expect(exports.getOrmVersion).toStrictEqual(expect.any(Function));
            expect(exports.getOrmVersion()).toStrictEqual(OMV);
          });

          initForestExpressMongoose({ objectMapping: { version: OMV } });
        });
      });

      describe('should contains a function getDatabaseType', () => {
        it('should return the database type for a single database', () => {
          expect.assertions(2);

          createForestExpressInitSpy((exports) => {
            expect(exports.getDatabaseType).toStrictEqual(expect.any(Function));
            expect(exports.getDatabaseType()).toStrictEqual('MongoDB');
          });

          initForestExpressMongoose({
            objectMapping: {},
            connections: {
              database1: {},
            },
          });
        });

        it('should return "multiple" type for a multiple databases setup', () => {
          expect.assertions(2);

          createForestExpressInitSpy((exports) => {
            expect(exports.getDatabaseType).toStrictEqual(expect.any(Function));
            expect(exports.getDatabaseType()).toStrictEqual('multiple');
          });

          initForestExpressMongoose({
            objectMapping: {},
            connections: {
              database1: {},
              database2: {},
            },
          });
        });
      });

      describe('should contains a function getModelName', () => {
        it('should return a name of a model', () => {
          expect.assertions(2);

          const MODEL_NAME = 'aModelName';

          createForestExpressInitSpy((exports) => {
            expect(exports.getModelName).toStrictEqual(expect.any(Function));
            expect(exports.getModelName({ modelName: MODEL_NAME })).toStrictEqual(MODEL_NAME);
          });

          initForestExpressMongoose();
        });
      });

      describe('when providing a correct connections option', () => {
        it('should pass a useMultipleDatabases option set to false when a single connection is provided', () => {
          expect.assertions(1);

          createForestExpressInitSpy(({ opts }) => {
            expect(opts.useMultipleDatabases).toStrictEqual(false);
          });

          initForestExpressMongoose({ connections: { database1: { models: {} } } });
        });

        it('should pass a useMultipleDatabases option set to true when multiples connections are provided', () => {
          expect.assertions(1);

          createForestExpressInitSpy(({ opts }) => {
            expect(opts.useMultipleDatabases).toStrictEqual(true);
          });

          initForestExpressMongoose({
            connections: {
              database1: {},
              database2: {},
            },
          });
        });
      });

      it('should contain a list of integrations', () => {
        expect.assertions(9);

        createForestExpressInitSpy(({
          Stripe,
          Intercom,
          Mixpanel,
          Layer,
        }) => {
          expect(Stripe).toBeInstanceOf(Object);
          expect(Stripe.getCustomer).toBeInstanceOf(Function);
          expect(Stripe.getCustomerByUserField).toBeInstanceOf(Function);

          expect(Intercom).toBeInstanceOf(Object);
          expect(Intercom.getCustomer).toBeInstanceOf(Function);

          expect(Mixpanel).toBeInstanceOf(Object);
          expect(Mixpanel.getUser).toBeInstanceOf(Function);

          expect(Layer).toBeInstanceOf(Object);
          expect(Layer.getUser).toBeInstanceOf(Function);
        });

        initForestExpressMongoose();
      });
    });
  });

  describe('when the given configuration is incorrect', () => {
    describe('when objectMapping option is missing', () => {
      it('should log an error', async () => {
        expect.assertions(1);
        jest.resetAllMocks();

        const spy = jest.spyOn(forestExpressMock.logger, 'error');
        initForestExpressMongoose({ objectMapping: null });
        expect(spy).toHaveBeenCalledWith('The objectMapping option appears to be missing. Please make sure it is set correctly.');
      });

      it('should not throw an error', () => {
        expect.assertions(1);

        expect(() => initForestExpressMongoose({ objectMapping: null })).not.toThrow();
      });

      it('should return a promised function', async () => {
        expect.assertions(2);

        const result = initForestExpressMongoose({ objectMapping: null });
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Function);
      });
    });

    describe('when mongoose option is provided', () => {
      it('should log a warning', async () => {
        expect.assertions(1);
        jest.resetAllMocks();

        const spy = jest.spyOn(forestExpressMock.logger, 'warn');
        initForestExpressMongoose({ mongoose: {} });
        expect(spy).toHaveBeenCalledWith('The mongoose option is not supported anymore. Please remove this option.');
      });
    });
  });
});
