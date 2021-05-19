
function BelongsToUpdater(model, association, opts, params, data) {
  this.perform = async () => {
    const updateParams = {};
    updateParams[params.associationName] = data.data ? data.data.id : null;

    return model
      .findByIdAndUpdate(params.recordId, {
        $set: updateParams,
      }, {
        new: true,
      })
      .lean()
      .exec();
  };
}

module.exports = BelongsToUpdater;
