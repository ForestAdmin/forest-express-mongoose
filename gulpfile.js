'use strict';
var gulp = require('gulp');
var moment = require('moment');
var fs = require('fs');
var simpleGit = require('simple-git')();
var semver = require('semver');

gulp.task('build', function () {
  var numberToIncrement = 'patch';
  if (process.argv && process.argv[3]) {
    var option = process.argv[3].replace('--', '');
    if (['major', 'minor', 'patch'].indexOf(option) !== -1) {
      numberToIncrement = option;
    }
  }

  // VERSION
  var versionFile = fs.readFileSync('package.json').toString().split('\n');
  var version = versionFile[3].match(/\w*"version": "(.*)",/)[1];
  version = semver.inc(version, numberToIncrement);
  versionFile[3] = '  "version": "' + version + '",';
  fs.writeFileSync('package.json', versionFile.join('\n'));

  // CHANGELOG
  var data = fs.readFileSync('CHANGELOG.md').toString().split('\n');
  var today = moment().format('YYYY-MM-DD');

  data.splice(3, 0, '\n## RELEASE ' + version + ' - ' + today);
  var text = data.join('\n');

  fs.writeFileSync('CHANGELOG.md', text);

  // COMMIT
  simpleGit.add(['CHANGELOG.md', 'package.json'], function () {
    simpleGit.commit('Release ' + version);
  });
});
