'use strict';

exports.Unauthorized = function (msg) {
  this.name = 'Unauthorized';
  this.status = 401;
  this.message = msg;
  Error.call(this, msg);
};
