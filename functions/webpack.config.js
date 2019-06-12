const path = require('path');
const nodeExternals = require('webpack-node-externals');

const output_path = 'dist';

module.exports = function(env, argv) {
    return [
        {
            target: 'node',
            entry: './src/index.ts',
            externals: [nodeExternals()],
            output: {
                path: path.resolve(__dirname, output_path),
                filename: 'index.js',
                libraryTarget: 'this',
            },
            resolve: {
                extensions: ['.ts', '.js', '.json'],
                modules: ['node_modules'],
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        exclude: /node_modules/,
                        use: ['ts-loader'],
                    },
                ],
            },
        },
    ];
};
