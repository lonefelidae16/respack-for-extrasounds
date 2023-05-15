module.exports = {
    plugins: [
        'stylelint-order',
    ],
    extends: [
        'stylelint-config-standard',
        'stylelint-config-recommended',
        'stylelint-config-recess-order',
        'stylelint-config-recommended-scss',
    ],
    ignoreFiles: [ '**/node_modules/**', '**/dist/**', '**/vendor/**', '**/*.js*' ],
    rules: {
        'indentation': 4,
        'scss/selector-no-union-class-name': true,
        'selector-class-pattern': null,
        'selector-id-pattern': null,
    },
};
