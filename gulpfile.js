'use strict';
var gulp = require('gulp');
var moment = require('moment');
var fs = require('fs');
var simpleGit = require('simple-git')();
var semver = require('semver');

var BRANCH_MASTER = 'master';
var BRANCH_DEVEL = 'devel';

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

  simpleGit
    .checkout(BRANCH_DEVEL)
    .then(function() { console.log('Starting pull on ' + BRANCH_DEVEL + '...'); })
    .pull(function(error) { if (error) { console.log(error); } })
    .then(function() { console.log(BRANCH_DEVEL + ' pull done.'); })
    .then(function() { fs.writeFileSync('CHANGELOG.md', text); })
    .add(['CHANGELOG.md', 'package.json'])
    .commit('Release ' + version)
    .push()
    .checkout(BRANCH_MASTER)
    .then(function() { console.log('Starting pull on ' + BRANCH_MASTER + '...'); })
    .pull(function(error) { if (error) { console.log(error); } })
    .then(function() { console.log(BRANCH_MASTER + ' pull done.'); })
    .mergeFromTo(BRANCH_DEVEL, BRANCH_MASTER)
    .push();
});
