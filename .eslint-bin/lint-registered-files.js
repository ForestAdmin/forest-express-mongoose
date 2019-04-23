const fs = require('fs');
const _ = require('lodash');
const simpleGit = require('simple-git')(`${__dirname}/..`);
let listFilesModified = require('./js-list.json')

 if (listFilesModified.length === 0) {
  process.exit(0);
}

 console.log(`[ESLint] Validating changed files:\n${listFilesModified.join('\n')}`);

 const eslintPath = `${__dirname}/../node_modules/.bin/eslint`;
const spawn = require('child_process').spawn;
const cmd = spawn(eslintPath, listFilesModified, { stdio: 'inherit', shell: true });

 cmd.on('exit', code => process.exit(code));
