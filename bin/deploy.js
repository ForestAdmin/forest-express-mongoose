const moment = require('moment');
const fs = require('fs');
const simpleGit = require('simple-git')();
const semver = require('semver');

const BRANCH_MASTER = 'master';
const BRANCH_DEVEL = 'devel';
const RELEASE_OPTIONS = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];

let releaseType = 'patch';
let prereleaseTag;

if (process.argv) {
  if (process.argv[3]) {
    const option = process.argv[3].replace('--', '');
    if (RELEASE_OPTIONS.includes(option)) {
      releaseType = option;
    }
  }
  if (process.argv[4]) {
    const option = process.argv[4].replace('--', '');
    prereleaseTag = option;
  }
}

// VERSION
const versionFile = fs.readFileSync('package.json').toString().split('\n');
let version = versionFile[3].match(/\w*"version": "(.*)",/)[1];
version = semver.inc(version, releaseType, prereleaseTag);
versionFile[3] = '  "version": "' + version + '",';
const newVersionFile = versionFile.join('\n');

// CHANGELOG
const changes = fs.readFileSync('CHANGELOG.md').toString().split('\n');
const today = moment().format('YYYY-MM-DD');

changes.splice(3, 0, '\n## RELEASE ' + version + ' - ' + today);
const newChanges = changes.join('\n');

const tag = 'v' + version;

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
