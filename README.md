# Forest Express/Mongoose Liana

The official Express/Mongoose liana for Forest.  
Forest is a modern admin interface (see the [live demo](https://app.forestadmin.com/login?livedemo)) that works on all major web frameworks.
forest-express-mongoose is the NPM package that makes Forest admin work on any Express/Mongoose application.

## Installation

Visit [Forest's website](http://www.forestadmin.com), enter your email and click "Get started".  
You will then follow a 4-step process:

1. Choose your stack (Express/Mongoose)
2. Install Forest Liana
  ```bash
  # Install the NPM package
  npm install forest-express-mongoose --save
  ```

  ```javascript
  // Add the following code to your app.js file:
  app.use(require('forest-express-mongoose').init({
    modelsDir: __dirname + '/models', // Your models directory.
    envSecret: process.env.FOREST_ENV_SECRET,
    authSecret: process.env.FOREST_AUTH_SECRET,
    mongoose: require('mongoose') // The mongoose database connection.
  }));
  ```
  ```bash
  # Setup Forest environment variables and do not version them
  FOREST_ENV_SECRET=FOREST-ENV-SECRET # This secret is provided by Forest during the project creation
  FOREST_AUTH_SECRET=FOREST-AUTH-SECRET # Choose a secure auth secret and keep it in a safe place
  ```
3. Get your app running, provide your application URL and check if you have successfully installed the Forest Liana on your app.  
4. Choose your credentials, log into https://app.forestadmin.com and start customizing your admin interface! 🎉

**NOTE: If you’re stuck, can’t get something working or need some help, feel free to contact the Forest team at support@forestadmin.com**

## How it works

Installing forest-express-mongoose into your app will automatically generate an admin REST API for your app.  
This API allows the Forest admin UI to communicate with your app and operate on your data.  
Note that data from your app will never reach Forest's servers. Only your UI configuration is saved.  
As this NPM package is open-source, you're free to extend the admin REST API for any operation specific to your app.  

## Integrations

One core concept of Forest is to bring all your data back into one single admin interface. Forest integrates with the 3rd party services / SaaS you already use and allow you to manage all your operations from one place.

Check out our documentation about integrations: http://doc.forestadmin.com/developers-guide/#integrations

## Documentation

Complete documentation is available at http://doc.forestadmin.com/developers-guide

## How to contribute

This liana is officially maintained by Forest.  
We're always happy to get contributions for other fellow lumberjacks.  
All contributions will be reviewed by Forest's team before being merged into master.

Install JSHint for the Git hooks:
`npm install jshint -g`

Here is the contribution workflow:

1. **Fork** the repo on GitHub
2. **Clone** the project to your own machine
3. **Commit** changes to your own branch
4. **Push** your work back up to your fork
5. Submit a **Pull request** so that we can review your changes

## Licence

[GPL v3](https://github.com/ForestAdmin/forest-express-mongoose/blob/master/LICENSE)
