const path = require('path');

module.exports = {
    entry: './yamlChecker.js',
    target: 'node',
    output: {
        filename: 'yamlChecker.bin.js',
        path: path.resolve(__dirname, 'dist')
    },
    node: {
        fs: 'empty'
    }
};
