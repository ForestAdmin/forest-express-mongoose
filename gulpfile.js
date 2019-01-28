'use strict';
var gulp = require('gulp');
var moment = require('moment');
var fs = require('fs');
var simpleGit = require('simple-git')();
var semver = require('semver');

var BRANCH_MASTER = 'master';
var BRANCH_DEVEL = 'devel';
var RELEASE_OPTIONS = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];

gulp.task('build', function () {
  var releaseType = 'patch';
  var prereleaseTag;

  if (process.argv) {
    if (process.argv[3]) {
      var option = process.argv[3].replace('--', '');
      if (RELEASE_OPTIONS.includes(option)) {
        releaseType = option;
      }
    }
    if (process.argv[4]) {
      var option = process.argv[4].replace('--', '');
      prereleaseTag = option;
    }
  }

  // VERSION
  var versionFile = fs.readFileSync('package.json').toString().split('\n');
  var version = versionFile[3].match(/\w*"version": "(.*)",/)[1];
  version = semver.inc(version, releaseType, prereleaseTag);
  versionFile[3] = '  "version": "' + version + '",';
  var newVersionFile = versionFile.join('\n');

  // CHANGELOG
  var changes = fs.readFileSync('CHANGELOG.md').toString().split('\n');
  var today = moment().format('YYYY-MM-DD');

  changes.splice(3, 0, '\n## RELEASE ' + version + ' - ' + today);
  var newChanges = changes.join('\n');

  var tag = 'v' + version;

  simpleGit
    .checkout(BRANCH_DEVEL)
    .pull(function (error) { if (error) { console.log(error); } })
    .then(function () { console.log('Pull ' + BRANCH_DEVEL + ' done.'); })
    .then(function () {
      fs.writeFileSync('package.json', newVersionFile);
      fs.writeFileSync('CHANGELOG.md', newChanges);
    })
    .add(['CHANGELOG.md', 'package.json'])
    .commit('Release ' + version)
    .push()
    .then(function () { console.log('Commit Release on ' + BRANCH_DEVEL + ' done.'); })
    .checkout(BRANCH_MASTER)
    .pull(function (error) { if (error) { console.log(error); } })
    .then(function () { console.log('Pull ' + BRANCH_MASTER + ' done.'); })
    .mergeFromTo(BRANCH_DEVEL, BRANCH_MASTER)
    .then(function () { console.log('Merge ' + BRANCH_DEVEL + ' on ' + BRANCH_MASTER + ' done.'); })
    .push()
    .addTag(tag)
    .push('origin', tag)
    .then(function () { console.log('Tag ' + tag + ' on ' + BRANCH_MASTER + ' done.'); })
    .checkout(BRANCH_DEVEL);
});
