
function ResourceRemover(Model, params) {
  this.perform = async () => {
    await Model.deleteOne({ _id: params.recordId });
  };
}

module.exports = ResourceRemover;
