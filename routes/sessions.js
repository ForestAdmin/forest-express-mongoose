'use strict';
var _ = require('lodash');
var auth = require('../services/auth');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

module.exports = function (app, opts) {

  function login(req, res) {
    var user = _.find(auth.allowedUsers, function (allowedUser) {
      return allowedUser.email === req.body.email &&
        bcrypt.compareSync(req.body.password, allowedUser.password);
    });

    if (user) {
      var token = jwt.sign({
        type: 'users',
        id: user.id,
        data: {
          email: user.email,
          'first_name': user['first-name'],
          'last_name': user['last-name']
        }
      }, opts.authKey, {
        expiresIn: '14 days'
      });

      res.send({ token: token });
    } else {
      res.status(401).send();
    }
  }

  this.perform = function () {
    app.post('/forest/sessions', login);
  };
};

