import HasManyAssociator from '../../../src/services/has-many-associator';

describe('service > has-many-associator', () => {
  describe('when the association comes from flattened field', () => {
    it('should flatten the association name before associating', () => {
      expect.assertions(1);

      class FakeModel {
        findByIdAndUpdate() {
          return this;
        }

        lean() {
          return this;
        }

        exec() {
          return this;
        }
      }

      const fakeModel = new FakeModel();
      const spy = jest.spyOn(fakeModel, 'findByIdAndUpdate');

      const hasManyAssociator = new HasManyAssociator(
        fakeModel,
        null,
        null,
        { associationName: 'engine@@@company', recordId: 1 },
        { data: [{ id: '1' }, { id: '2' }] },
      );

      hasManyAssociator.perform();

      expect(spy).toHaveBeenCalledWith(
        1,
        {
          $push: {
            'engine.company': {
              $each: ['1', '2'],
            },
          },
        },
        {
          new: true,
        },
      );
    });
  });
});
