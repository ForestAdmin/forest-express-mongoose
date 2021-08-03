import BelongsToUpdater from '../../../src/services/belongs-to-updater';

describe('service > belongs-to-updater', () => {
  describe('when the association comes from a flattened field', () => {
    it('should flatten the association name before updating', () => {
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

      const belongsToUpdater = new BelongsToUpdater(
        fakeModel,
        null,
        null,
        { associationName: 'engine@@@company', recordId: 1 },
        { data: { id: '1' } },
      );

      belongsToUpdater.perform();

      expect(spy).toHaveBeenCalledWith(
        1,
        {
          $set: {
            'engine.company': '1',
          },
        },
        {
          new: true,
        },
      );
    });
  });
});
