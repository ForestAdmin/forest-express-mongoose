const Interface = require('forest-express');

module.exports = class FieldsFlattener {
  constructor(schema, flatten) {
    this.schema = schema;
    this.flatten = flatten;
  }

  _removeWrongFlattenConfiguration(index) {
    this.flatten.splice(index, 1);
  }

  _doesFieldExist(fieldName, index) {
    const fieldToFlatten = this.schema.fields
      .find((field) => field.field === fieldName);

    if (!fieldToFlatten) {
      Interface.logger.warn(`Could not flatten field ${fieldName} because it does not exist`);
      this._removeWrongFlattenConfiguration(index);
    }
  }

  _validateFlattenObjectConfiguration(flattenConfiguration, configurationIndex) {
    if (!flattenConfiguration.field) {
      Interface.logger.warn(`Could not flatten field with the following configuration ${JSON.stringify(flattenConfiguration)} because no field has been specified`);
      this._removeWrongFlattenConfiguration(configurationIndex);
    } else {
      this._doesFieldExist(flattenConfiguration.field, configurationIndex);

      if (flattenConfiguration.level !== undefined) {
        flattenConfiguration.level = parseInt(flattenConfiguration.level, 10);

        if (Number.isNaN(flattenConfiguration.level)) {
          Interface.logger.warn(`Could not parse flatten level for field ${flattenConfiguration.field}, defaulting to infinite`);
          delete flattenConfiguration.level;
        }
      }
    }
  }

  validateOptions() {
    if (!this.flatten) {
      this.flatten = [];
      return;
    }

    if (!Array.isArray(this.flatten)) {
      Interface.logger.error(`Could not flatten fields from collection ${this.schema.name}, flatten property should be an array.`);
      return;
    }

    this.flatten.forEach((flattenConfiguration, index) => {
      switch (typeof flattenConfiguration) {
        case 'string':
          this.flatten[index] = { field: flattenConfiguration };
          this._doesFieldExist(flattenConfiguration, index);
          break;
        case 'object':
          this._validateFlattenObjectConfiguration(flattenConfiguration, index);
          break;
        default: {
          Interface.logger.warn(`Could not identify the field to flatten with ${JSON.stringify(flattenConfiguration)}`);
        }
      }
    });
  }

  _flattenField(schema, parentFieldName, newFields = [], level = undefined) {
    if (schema.type?.fields && (level === undefined || level > -1)) {
      schema.type.fields.forEach((subField) => {
        const newFieldName = parentFieldName ? `${parentFieldName}|${subField.field}` : schema.field;
        this._flattenField(
          subField,
          newFieldName,
          newFields,
          level === undefined ? level : level - 1,
        );
      });
    } else {
      schema.field = parentFieldName;
      newFields.push(schema);
    }
  }

  flattenFields() {
    this.validateOptions();

    const indexes = [];
    const newFields = [];

    this.flatten.forEach((flattenConfiguration) => {
      const fieldSchemaIndex = this.schema.fields
        .findIndex((field) => field.field === flattenConfiguration.field);
      const fieldSchema = this.schema.fields[fieldSchemaIndex];

      indexes.push(fieldSchemaIndex);
      this._flattenField(fieldSchema, fieldSchema.field, newFields, flattenConfiguration.level);
    });

    indexes.forEach((fieldIndex) => this.schema.fields.splice(fieldIndex));

    this.schema.fields = [...this.schema.fields, ...newFields];
  }
};
