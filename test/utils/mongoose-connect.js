const mongoose = require('mongoose');
const P = require('bluebird');

mongoose.Promise = P;

function mongooseConnect() {
  return new P((resolve, reject) => {
    mongoose.connect('mongodb://localhost:27017/forest-test');

    const db = mongoose.connection;
    db.on('error', (error) => {
      reject(error);
    });
    db.once('open', () => {
      resolve();
    });
  });
}

module.exports = mongooseConnect;
