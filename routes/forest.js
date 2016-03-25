'use strict';

module.exports = function (app) {
  this.perform = function () {
    app.get('/forest', function (req, res) {
      res.status(204).send();
    });
  };
};
