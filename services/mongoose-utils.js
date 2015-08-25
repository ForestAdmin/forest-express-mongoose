'use strict';
var _ = require('lodash');

module.exports = {
  getReference: function(opts) {
    if (opts && opts.options) {
      if (opts.options.ref) {
        return opts.options.ref;
      } else if (_.isArray(opts.options.type) && opts.options.type.length &&
        opts.options.type[0].ref) {
        return opts.options.type[0].ref;
      }
    }
  }
};
