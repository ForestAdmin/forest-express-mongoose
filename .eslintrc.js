module.exports = {
  root: true,
  extends: [
    'airbnb-base',
    'plugin:jest/all',
    'plugin:sonarjs/recommended',
  ],
  plugins: [
    'sonarjs',
  ],
  env: {
    node: true,
  },
  ignorePatterns: [
    'dist/**'
  ],
  rules: {
    'implicit-arrow-linebreak': 0,
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          '.eslint-bin/*.js',
          'test/**/*.js'
        ]
      }
    ],
    'jest/no-hooks': 0,
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'sonarjs/cognitive-complexity': 1,
    'sonarjs/no-duplicate-string': 0,
    'sonarjs/no-duplicated-branches': 1,
    'sonarjs/no-identical-functions': 0,
    'sonarjs/no-same-line-conditional': 0
  },
  parser: "babel-eslint",
};
