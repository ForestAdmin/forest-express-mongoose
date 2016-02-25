'use strict';
var error = require('./error');

exports.ensureAuthenticated = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    return next(new error.Unauthorized('Bad JWT token.'));
  }
};

exports.allowedUsers = [];
