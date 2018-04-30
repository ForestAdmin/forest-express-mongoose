module.exports = {
    'env': {
        'node': true
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
      'ecmaVersion': 5
    },
    'rules': {
        'indent': [
            'error',
            2,
            { "SwitchCase": 1 }
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ]
    }
};
