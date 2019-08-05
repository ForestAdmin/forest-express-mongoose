const semver = require('semver');

const REGEX_VERSION = /(\d+\.)?(\d+\.)?(\*|\d+)/;

const getVersion = (mongoose) => {
  try {
    const version = mongoose.version.match(REGEX_VERSION);
    if (version && version[0]) {
      return version[0];
    }
    return null;
  } catch (error) {
    return null;
  }
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
