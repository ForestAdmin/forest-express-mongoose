var mongoose = require('mongoose');
var P = require('bluebird');

mongoose.Promise = P;

function mongooseConnect() {
  return new P(function (resolve, reject) {
    mongoose.connect('mongodb://localhost:27017/forest-test');

    var db = mongoose.connection;
    db.on('error', function (error) {
      reject(error);
    });
    db.once('open', function () {
      resolve();
    });
  });
}

module.exports = mongooseConnect;
