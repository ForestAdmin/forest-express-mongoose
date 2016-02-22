'use strict';
var P = require('bluebird');
var request = require('superagent');
var jwt = require('jsonwebtoken');

function ActivityLogLogger(opts) {
  function getProjectId(user) {
    return user.session.data.relationships.project.data.id;
  }

  this.perform = function (user, action, collectionName, resource) {
    var json = {
      action: action,
      collection: collectionName,
      resource: resource
    };

    var token = jwt.sign(user, opts.jwtSigningKey);

    var forestUrl = process.env.FOREST_URL ||
      'https://forestadmin-server.herokuapp.com';

    return new P(function (resolve, reject) {
      request
        .post(forestUrl + '/api/projects/' + getProjectId(user) +
          '/activity-logs')
        .send(json)
        .set('Authorization', 'Bearer ' + token)
        .end(function(err, res) {
          if (err) { return reject(err); }
          resolve(res);
        });
    });
  };
}

module.exports = ActivityLogLogger;
