const semver = require('semver');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

const getVersion = (mongoose) => {
  const version = mongoose.version.match(REGEX_VERSION);
  if (version && version[0]) {
    return version[0];
  }
  return null;
};

const hasRequiredVersion = (mongoose, version) => {
  try {
    return semver.gte(getVersion(mongoose), version);
  } catch (error) {
    return false;
  }
};

exports.getVersion = getVersion;
exports.hasRequiredVersion = hasRequiredVersion;
