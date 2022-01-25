const forestExpressMongoose = require('../../src/index');

describe('index', () => {
  describe('exported Interface', () => {
    it('should export the request unflattener', () => {
      expect.assertions(2);

      expect(forestExpressMongoose.requestUnflattener).toBeDefined();
      expect(forestExpressMongoose.requestUnflattener).toBeInstanceOf(Function);
    });

    it('should export a collection function', () => {
      expect.assertions(2);

      expect(forestExpressMongoose.collection).toBeDefined();
      expect(forestExpressMongoose.collection).toBeInstanceOf(Function);
    });

    it('should export an ensureAuthenticated middleware', () => {
      expect.assertions(2);

      expect(forestExpressMongoose.ensureAuthenticated).toBeDefined();
      expect(forestExpressMongoose.ensureAuthenticated).toBeInstanceOf(Function);
    });

    it('should export an errorHandler middleware', () => {
      expect.assertions(2);

      expect(forestExpressMongoose.errorHandler).toBeDefined();
      expect(forestExpressMongoose.errorHandler).toBeInstanceOf(Function);
    });

    it('should export a list of serializers and deserializers', () => {
      expect.assertions(4);

      expect(forestExpressMongoose.StatSerializer).toBeDefined();
      expect(forestExpressMongoose.StatSerializer).toBeInstanceOf(Function);

      expect(forestExpressMongoose.ResourceSerializer).toBeDefined();
      expect(forestExpressMongoose.ResourceSerializer).toBeInstanceOf(Function);
    });

    it('should export deactivate count middleware', () => {
      expect.assertions(2);

      expect(forestExpressMongoose.deactivateCountMiddleware).toBeDefined();
      expect(forestExpressMongoose.deactivateCountMiddleware).toBeInstanceOf(Function);
    });

    it('should export a list of records functions', () => {
      expect.assertions(20);

      expect(forestExpressMongoose.PermissionMiddlewareCreator).toBeDefined();
      expect(forestExpressMongoose.PermissionMiddlewareCreator).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordsCounter).toBeDefined();
      expect(forestExpressMongoose.RecordsCounter).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordsExporter).toBeDefined();
      expect(forestExpressMongoose.RecordsExporter).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordsGetter).toBeDefined();
      expect(forestExpressMongoose.RecordsGetter).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordGetter).toBeDefined();
      expect(forestExpressMongoose.RecordGetter).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordUpdater).toBeDefined();
      expect(forestExpressMongoose.RecordUpdater).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordCreator).toBeDefined();
      expect(forestExpressMongoose.RecordCreator).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordRemover).toBeDefined();
      expect(forestExpressMongoose.RecordRemover).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordsRemover).toBeDefined();
      expect(forestExpressMongoose.RecordsRemover).toBeInstanceOf(Function);

      expect(forestExpressMongoose.RecordSerializer).toBeDefined();
      expect(forestExpressMongoose.RecordSerializer).toBeInstanceOf(Function);
    });

    it('should export the PUBLIC_ROUTES', () => {
      expect.assertions(2);
      expect(forestExpressMongoose.PUBLIC_ROUTES).toBeDefined();
      expect(forestExpressMongoose.PUBLIC_ROUTES).toBeInstanceOf(Array);
    });
  });
});
