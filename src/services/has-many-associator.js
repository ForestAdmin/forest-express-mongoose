
function HasManyAssociator(model, association, opts, params, data) {
  this.perform = () => {
    const updateParams = {};
    updateParams[params.associationName] = {
      $each: data.data.map((document) => document.id),
    };

    return model
      .findByIdAndUpdate(params.recordId, {
        $push: updateParams,
      }, {
        new: true,
      })
      .lean()
      .exec();
  };
}

module.exports = HasManyAssociator;
