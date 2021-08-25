import ResourceCreator from '../../../src/services/resource-creator';
import Flattener from '../../../src/services/flattener';

const FLATTEN_SEPARATOR = '@@@';

describe('service > resource-creator', () => {
  describe('when the body contains flattened fields', () => {
    it('should unflatten the fields before creation', () => {
      expect.assertions(2);

      class FakeModel {
        save() {
          return this;
        }
      }

      const fakeModel = new FakeModel();

      const spy = jest.spyOn(Flattener, 'unflattenFieldNamesInObject');

      const body = {
        [`engine${FLATTEN_SEPARATOR}horsePower`]: '125cv',
        name: 'Car',
        [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`]: 'Renault',
      };

      const resourceCreator = new ResourceCreator(fakeModel, null, body, null);

      expect(resourceCreator._body).toStrictEqual({
        name: 'Car',
        'engine.horsePower': '125cv',
        'engine.identification.manufacturer': 'Renault',
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
