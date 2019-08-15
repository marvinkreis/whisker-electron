const path = require('path');

module.exports = [

    /* JS */
    {
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        target: 'web',
        entry: {
            'scratch': path.resolve(__dirname, 'src/scratch.js')
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: path.resolve(__dirname, 'src')
                },
                {
                    test: path.resolve('src', 'scratch.js'),
                    loader: 'expose-loader?Scratch'
                }
            ]
        },
        devtool: 'source-map'
    }
];
