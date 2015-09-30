'use strict';
var winston = require('winston');

winston.addColors({ debug: 'green' });
winston.level = 'debug';
winston.loggers.add('forest', {
  console: {
    level: 'debug',
    colorize: true,
    label: 'Forest'
  }
});

module.exports = winston.loggers.get('forest');
