'use strict';
var P = require('bluebird');
var request = require('superagent');
var jwt = require('jsonwebtoken');

function ActivityLogLogger(opts) {
  this.perform = function (user, action, collectionName, resource) {
    var json = {
      action: action,
      collection: collectionName,
      resource: resource,
      user: user.id
    };

    var token = jwt.sign(user, opts.jwtSigningKey);

    var forestUrl = process.env.FOREST_URL ||
      'https://forestadmin-server.herokuapp.com';

    console.log(require('util').inspect(opts.secretKey, { depth: null }));

    return new P(function (resolve, reject) {
      request
        .post(forestUrl + '/api/activity-logs')
        .send(json)
        .set('Authorization', 'Bearer ' + token)
        //.set('Content-Type', 'application/vnd.api+json')
        .set('forest-secret-key', opts.secretKey)
        .end(function(err, res) {
          if (err) { return reject(err); }
          resolve(res);
        });
    });
  };
}

module.exports = ActivityLogLogger;
