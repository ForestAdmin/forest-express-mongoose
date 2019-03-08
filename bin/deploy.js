'use strict';
const moment = require('moment');
const fs = require('fs');
const simpleGit = require('simple-git')();
const semver = require('semver');

const BRANCH_MASTER = 'master';
const BRANCH_DEVEL = 'devel';

let numberToIncrement = 'patch';
if (process.argv && process.argv[3]) {
  const option = process.argv[3].replace('--', '');
  if (['major', 'minor', 'patch'].indexOf(option) !== -1) {
    numberToIncrement = option;
  }
}

// VERSION
const versionFile = fs.readFileSync('package.json').toString().split('\n');
let version = versionFile[3].match(/\w*"version": "(.*)",/)[1];
version = semver.inc(version, numberToIncrement);
versionFile[3] = '  "version": "' + version + '",';
fs.writeFileSync('package.json', versionFile.join('\n'));

// CHANGELOG
const data = fs.readFileSync('CHANGELOG.md').toString().split('\n');
const today = moment().format('YYYY-MM-DD');

data.splice(3, 0, '\n## RELEASE ' + version + ' - ' + today);
const text = data.join('\n');

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
