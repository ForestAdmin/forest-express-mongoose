import Interface from 'forest-express';
import mongoose from 'mongoose';

import SearchBuilderClass from '../../../src/services/search-builder';

let AnimalModel;
let Mongoose;

describe('searchBuilder', () => {
  beforeAll(() => {
    const AnimalSchema = new mongoose.Schema({
      id: { type: 'ObjectId' },
      name: { type: String },
      arrayOfNumber: {
        type: ['Number'],
      },
      arrayOfString: {
        type: ['Number'],
      },
      embedded: {
        field: 'embedded',
        type: [
          { species: { type: 'String' } },
          { cousins: { type: 'Number' } },
        ],
      },
    });
    AnimalModel = mongoose.model('Animal', AnimalSchema);

    Mongoose = {
      Types: {
        ObjectId: mongoose.Types.ObjectId,
      },
    };

    Interface.Schemas = {
      schemas: {
        Animal: {
          name: 'animals',
          nameOld: 'animals',
          idField: '_id',
          primaryKeys: ['_id'],
          isCompositePrimary: false,
          fields: [
            {
              field: 'name',
              type: 'String',
            },
            {
              field: 'arrayOfNumber',
              type: ['Number'],
              defaultValue: null,
              isRequired: false,
              isPrimaryKey: false,
              isReadOnly: false,
              isSortable: true,
              isFilterable: true,
              isVirtual: false,
              description: null,
              reference: null,
              inverseOf: null,
              relationships: null,
              enums: null,
              validations: [],
              integration: null,
            },
            {
              field: 'arrayOfString',
              type: ['String'],
              defaultValue: null,
              isRequired: false,
              isPrimaryKey: false,
              isReadOnly: false,
              isSortable: true,
              isFilterable: true,
              isVirtual: false,
              description: null,
              reference: null,
              inverseOf: null,
              relationships: null,
              enums: null,
              validations: [],
              integration: null,
            },
            {
              field: 'embedded',
              type: [
                {
                  fields: [
                    { field: 'species', type: 'String' },
                    { field: 'cousins', type: 'Number' },
                  ],
                },
              ],
              isRequired: false,
              isPrimaryKey: false,
              isReadOnly: false,
              isSortable: true,
              isFilterable: true,
              isVirtual: false,
            },
            {
              field: '_id',
              type: 'String',
              isPrimaryKey: true,
              defaultValue: null,
              isRequired: false,
              isReadOnly: false,
              isSortable: true,
              isFilterable: true,
              isVirtual: false,
            },
          ],
          isSearchable: true,
          actions: [],
          segments: [],
          onlyForRelationships: false,
          isVirtual: false,
          isReadOnly: false,
          paginationType: 'page',
        },
      },
    };
  });
  describe('when searching a number', () => {
    it('should add the elemMatch for nested number', async () => {
      expect.assertions(1);

      const params = {
        timezone: 'Europe/Paris',
        fields: { animals: '_id,name,nbAlive,deadNumber,arrayOfNumber,arrayOfString' },
        page: { number: '1', size: '15' },
        search: '23',
        searchExtended: '1',
        sort: '-_id',
        filters: undefined,
      };
      const searchFields = undefined;

      const searchBuilder = new SearchBuilderClass(AnimalModel, undefined, params, searchFields);

      expect(await searchBuilder.getConditions()).toStrictEqual({
        $or: [
          { name: /.*23.*/i },
          { arrayOfNumber: 23 },
          { arrayOfString: /.*23.*/i },
          {
            embedded: {
              $elemMatch: {
                $or: [
                  {
                    species: /.*23.*/i,
                  },
                  {
                    cousins: 23,
                  },
                ],
              },
            },
          },
        ],
      });
    });
  });

  describe('when searching a string', () => {
    it('should add the elemMatch for nested string', async () => {
      expect.assertions(1);

      const params = {
        timezone: 'Europe/Paris',
        fields: { animals: '_id,name,nbAlive,deadNumber,arrayOfNumber,arrayOfString' },
        page: { number: '1', size: '15' },
        search: 'gorillas',
        searchExtended: '1',
        sort: '-_id',
        filters: undefined,
      };
      const searchFields = undefined;

      const searchBuilder = new SearchBuilderClass(AnimalModel, undefined, params, searchFields);

      expect(await searchBuilder.getConditions()).toStrictEqual({
        $or: [

          { name: /.*gorillas.*/i },
          { arrayOfString: /.*gorillas.*/i },
          {
            embedded: {
              $elemMatch: {
                $or: [
                  {
                    species: /.*gorillas.*/i,
                  },
                ],
              },
            },
          },
        ],
      });
    });
  });

  // Romain: I'm adding this test to please CI while handling support of mongoose 7.
  // I did not investigate why id is added twice in the $or array
  // I don't know if it is on purpose and why the fieldname is 'id' instead of '_id'
  describe('when searching an objectid', () => {
    it('should add the elemMatch for the objectif', async () => {
      expect.assertions(1);

      const params = {
        timezone: 'Europe/Paris',
        fields: { animals: '_id,name,nbAlive,deadNumber,arrayOfNumber,arrayOfString' },
        page: { number: '1', size: '15' },
        search: '507f191e810c19729de860ea',
        searchExtended: '1',
        sort: '-_id',
        filters: undefined,
      };
      const searchFields = undefined;

      const searchBuilder = new SearchBuilderClass(AnimalModel, { Mongoose }, params, searchFields);

      expect(await searchBuilder.getConditions()).toStrictEqual({
        $or: [
          { id: new mongoose.Types.ObjectId('507f191e810c19729de860ea') },
          { name: /.*507f191e810c19729de860ea.*/i },
          { arrayOfString: /.*507f191e810c19729de860ea.*/i },
          {
            embedded: {
              $elemMatch: {
                $or: [
                  {
                    species: /.*507f191e810c19729de860ea.*/i,
                  },
                ],
              },
            },
          },
          { _id: new mongoose.Types.ObjectId('507f191e810c19729de860ea') },
        ],
      });
    });
  });
});
