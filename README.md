# Forest Express/Mongoose connector
[![Build Status](https://travis-ci.org/ForestAdmin/forest-express-mongoose.svg?branch=master)](https://travis-ci.org/ForestAdmin/forest-express-mongoose)
The official Express/Mongoose liana for Forest.

## Installation

1. Run `$ npm install forest-express-mongoose --save`
2. Add the following code to your `app.js` file:
```javascript
app.use(require('forest-express-mongoose').init({
  modelsDir: __dirname + '/models',  // The directory where all of your Mongoose models are defined.
  secretKey: 'ultrasecretkey', // The secret key given my Forest.
  authKey: 'catsOnKeyboard', // Choose an secret authentication key.
  mongoose: require('mongoose') // The mongoose instance given by require('mongoose').
}));
```

# License

[GPL v3](https://github.com/SeyZ/forest-express-mongoose/blob/master/LICENSE)
