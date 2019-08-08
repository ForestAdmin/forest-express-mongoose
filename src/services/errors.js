function NoMatchingOperatorError(message) {
  this.name = 'NoMatchingOperatorError';
  this.message = message || 'The given operator is not handled.';
  this.stack = (new Error()).stack;
}
NoMatchingOperatorError.prototype = new Error();

function InvalidFiltersFormatError(message) {
  this.name = 'InvalidFiltersFormatError';
  this.message = message || 'The filters format is not a valid JSON string.';
  this.stack = (new Error()).stack;
}
InvalidFiltersFormatError.prototype = new Error();

exports.NoMatchingOperatorError = NoMatchingOperatorError;
exports.InvalidFiltersFormatError = InvalidFiltersFormatError;
