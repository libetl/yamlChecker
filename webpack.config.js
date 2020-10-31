const path = require('path')
const webpack = require('webpack')

module.exports = {
    entry: './yamlChecker.js',
    target: 'node',
    output: {
        filename: 'yamlChecker.bin.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: '#!/usr/bin/env node',
            raw: true,
        })
    ]
}
