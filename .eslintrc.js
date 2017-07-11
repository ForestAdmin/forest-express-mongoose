module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017
  },
  extends: 'eslint:recommended',
  env: {
    node: true
  },
  rules: {
    'no-console': 'off',
    'quotes': ['error', 'single'],
    'no-trailing-spaces': 'error',
    'no-multi-spaces': 'error',
    'max-len': ['error', 80, {
      'ignoreComments': true,
      'ignoreStrings': true,
      'ignoreTemplateLiterals': true
    }]
  },
  globals: {
  }
};
