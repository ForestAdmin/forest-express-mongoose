module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all'
  ],
  plugins: [],
  env: {
    node: true,
  },
  rules: {
    'implicit-arrow-linebreak': 0,
    'jest/no-hooks': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          '.eslint-bin/*.js',
          'scripts/*.js',
          'test/**/*.js'
        ]
      }
    ]
  },
};
