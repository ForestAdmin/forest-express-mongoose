const fs = require('fs');
const _ = require('lodash');
const simpleGit = require('simple-git')(`${__dirname}/..`);
let filesListValid = require('./js-list.json')
let filesListChanged = [];

function addCommitedFilesToEslint(callback) {
  simpleGit.status((error, status) => {
    if (error) {
      console.error(error);
      process.exit(-1);
    }

    jsFilesListChanged = status.files
      .map(file => (file.path.includes(' -> ')
        ? file.path.substring(file.path.indexOf(' -> ') + 4) : file.path))
      .filter(file => file.endsWith('.js'));

    const addedFiles = _.difference(filesListChanged, filesListValid);

    filesListValid = _.uniq(filesListValid.concat(filesListChanged).sort());

    if (addedFiles.length !== 0) {
      fs.writeFileSync(`${__dirname}/js-list.json`, `${JSON.stringify(filesListValid, null, 2)}\n`);
      console.log(`[ESLint] Adding some files for CI validation:\n${addedFiles.join('\n')}`);
    }

    callback();
  });
}

function runEslint(callback) {
  if (filesListChanged.length === 0) {
    return callback(0);
  }

  console.log(`[ESLint] Validating changed files:\n${filesListChanged.join('\n')}`);
  const eslintPath = `${__dirname}/../node_modules/.bin/eslint`;
  const spawn = require('child_process').spawn;
  const cmd = spawn(eslintPath, filesListChanged, { stdio: 'inherit', shell: true });

  cmd.on('exit', function (code) {
    callback(code);
  });
}

addCommitedFilesToEslint((error) => {
  if (error) {
    console.error(error);
    process.exit(-2);
  }

  simpleGit.add(`${__dirname}/js-list.json`, (error) => {
    if (error) {
      console.error(error);
      process.exit(-3);
    }

    runEslint((code) => process.exit(code));
  })
});
