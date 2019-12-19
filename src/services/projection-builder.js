class ProjectionBuilder {
  constructor(schema) {
    this.schemaSmartFields = schema
      && schema.fields
      && schema.fields.filter((field) => field.get).map((field) => field.field);
  }

  // NOTICE: Convert a list of field names into a mongo $project structure.
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

  // NOTICE: Perform the intersection between schema and request smart fields.
  findRequestSmartField(requestFieldsNames) {
    if (this.schemaSmartFields && requestFieldsNames) {
      return this.schemaSmartFields
        .filter((fieldName) => requestFieldsNames.includes(fieldName));
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
