class ProjectionBuilder {
  constructor(schema) {
    this.schemaSmartFields = schema
      && schema.fields
      && schema.fields.filter((field) => field.get).map((field) => field.field);
  }

  // NOTICE: Convert a list of field names into a mongo $project structure
  static convertToProjection(fieldsNames) {
    if (fieldsNames) {
      const fieldsObject = fieldsNames.reduce((fields, fieldName) => {
        fields[fieldName] = 1;
        return fields;
      }, {});
      return { $project: fieldsObject };
    }
    return null;
  }

  static getReferredFields(smartFieldFunction) {
    const text = smartFieldFunction.toString();
    // eslint-disable-next-line
    console.log(text);
    return null;
  }

  static getSmartFieldDependancies(schema) {
    const smartFieldDependancies = {};
    if (schema && schema.fields) {
      schema.fields.forEach((field) => {
        if (field.get) {
          const referredFields = ProjectionBuilder.getReferredFields(field.get);
          if (referredFields) {
            smartFieldDependancies[field.field] = referredFields;
          }
        }
      });
    }
    return smartFieldDependancies;
  }

  expandSmartFields(fieldsNames) {
    const expandedFields = [];
    fieldsNames.forEach((field) => {
      const referencedFields = this.smartFieldMap[field];
      const fieldIsSmart = !!referencedFields;
      if (fieldIsSmart) {
        expandedFields.push(...referencedFields);
      } else {
        expandedFields.push(field);
      }
    });
    return expandedFields;
  }

  // NOTICE: Perform the intersection between schema and request smart fields.
  findRequestSmartField(requestFieldsNames) {
    if (this.schemaSmartFields && requestFieldsNames) {
      return this.schemaSmartFields
        .filter((fieldName) => requestFieldsNames.indexOf(fieldName) > -1);
    }
    return [];
  }

  getProjection(fieldNames) {
    const requestSmartFields = this.findRequestSmartField(fieldNames);
    if (requestSmartFields.length) return null;
    return ProjectionBuilder.convertToProjection(fieldNames);
  }
}

module.exports = ProjectionBuilder;
