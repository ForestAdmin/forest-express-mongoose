
function HasManyDissociator(model, association, opts, params, data) {
  const isDelete = Boolean(params.delete);

  this.perform = async () => {
    const documentIds = data.data.map((document) => document.id);
    if (isDelete) {
      await association.deleteMany({ _id: { $in: documentIds } });
    }

    const updateParams = {};
    updateParams[params.associationName] = { $in: documentIds };

    return model
      .findByIdAndUpdate(params.recordId, {
        $pull: updateParams,
      }, {
        new: true,
      })
      .lean()
      .exec();
  };
}

module.exports = HasManyDissociator;
