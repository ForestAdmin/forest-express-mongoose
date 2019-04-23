module.exports = {
  root: true,
  'extends': [
    'airbnb-base',
  ],
  plugins: [],
  env: {
    node: true,
  },
  rules: {
    'no-console': 0,
    'no-param-reassign': 0,
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
  },
};
