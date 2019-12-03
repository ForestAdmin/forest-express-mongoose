function EmbeddedDocumentUpdater(model, params, association, record) {
  this.perform = () => {
    const { recordId } = params;
    const recordIndex = parseInt(params.recordIndex, 10);

    delete record._id;

    const update = Object.keys(record).reduce((acc, value) => {
      acc.$set[`${association}.${recordIndex}.${value}`] = record[value];
      return acc;
    }, { $set: {} });

    return model.findByIdAndUpdate(recordId, update);
  };
}

module.exports = EmbeddedDocumentUpdater;
