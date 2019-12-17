const paramMatcher = /(?:.*?)\((.*?)\)/;

class ProjectionBuilder {
  constructor(schema) {
    this.smartFieldDependancies = ProjectionBuilder.getSmartFieldDependancies(schema);
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

  static getReferencedFields(smartFieldFunction) {
    const text = Function.prototype.toString.call(smartFieldFunction);
    const paramMatch = text.match(paramMatcher);
    const paramName = paramMatch[1];
    if (paramName) {
      const referencedFieldMatcher = new RegExp(`${paramName}.([a-zA-Z_$][0-9a-zA-Z_$]*)`, 'g');
      const propertiesMatches = [...text.matchAll(referencedFieldMatcher)];
      return propertiesMatches.map((property) => property[1]);
    }
    return null;
  }

  static getSmartFieldDependancies(schema) {
    const smartFieldDependancies = {};
    if (schema && schema.fields) {
      schema.fields.forEach((field) => {
        if (field.get) {
          const referredFields = ProjectionBuilder.getReferencedFields(field.get);
          if (referredFields) {
            smartFieldDependancies[field.field] = referredFields;
          }
        }
      });
    }
    return smartFieldDependancies;
  }

  // NOTICE: return a new array replacing smartfields by their dependancies.
  expandSmartFields(fieldsNames) {
    const expandedFields = [];
    fieldsNames.forEach((field) => {
      const referencedFields = this.smartFieldDependancies[field];
      const fieldIsSmart = !!referencedFields;
      if (fieldIsSmart) {
        expandedFields.push(...referencedFields);
      } else {
        expandedFields.push(field);
      }
    });
    return expandedFields;
  }

  getProjection(fieldNames) {
    const expandedFieldNames = this.expandSmartFields(fieldNames);
    return ProjectionBuilder.convertToProjection(expandedFieldNames);
  }
}

module.exports = ProjectionBuilder;
