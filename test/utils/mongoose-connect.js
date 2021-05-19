const mongoose = require('mongoose');

async function mongooseConnect() {
  await mongoose.connect(
    'mongodb://localhost:27017/forest-test',
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false },
  );
}

module.exports = mongooseConnect;
