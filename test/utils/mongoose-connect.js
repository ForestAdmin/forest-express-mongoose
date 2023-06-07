const mongoose = require('mongoose');

async function mongooseConnect() {
  await mongoose.connect('mongodb://localhost:27017/forest-test');
}

module.exports = mongooseConnect;
