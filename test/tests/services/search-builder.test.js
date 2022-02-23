import Interface from 'forest-express';
import mongoose from 'mongoose';

import SearchBuilderClass from '../../../src/services/search-builder';

describe('searchBuilder', () => {
  describe('filter with number array', () => {
    it('should add the number to the elemMatch', async () => {
      expect.assertions(1);

      const AnimalSchema = new mongoose.Schema({
        id: { type: 'ObjectId' },
        name: { type: String },
        arrayOfNumber: {
          type: ['Number'],
        },
        embedded: {
          field: 'embedded',
          type: [
            { species: { type: 'String', ref: 'species' } },
            { cousins: { type: 'Number' } },
          ],
        },
      });
      const AnimalModel = mongoose.model('Animal', AnimalSchema);
      const params = {
        timezone: 'Europe/Paris',
        fields: { animals: '_id,name,nbAlive,deadNumber,arrayOfNumber' },
        page: { number: '1', size: '15' },
        search: '23',
        searchExtended: '1',
        sort: '-_id',
        filters: undefined,
      };
      const searchFields = undefined;

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

      const searchBuilder = new SearchBuilderClass(AnimalModel, undefined, params, searchFields);
      //   searchBuilder.hasSmartFieldSearch = false;
      //   searchBuilder.getFieldsSearched = jest.mock();

      //  await searchBuilder.getConditions();

      expect(await searchBuilder.getConditions()).toStrictEqual({
        $or: [
          { name: /.*23.*/i },
          { arrayOfNumber: 23 },
          {
            embedded: {
              $elemMatch: {
                $or: [
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
});
