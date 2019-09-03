const path = require('path');
const nodeExternals = require('webpack-node-externals');

const output_path = 'dist';

const functions = ['airconController'];

const commonConfig = {
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: ['node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: ['ts-loader'],
            },
        ],
    },
};

module.exports = function(env, argv) {
    return [
        Object.assign(
            {
                target: 'node',
                entry: './src/index.ts',
                externals: [nodeExternals(), './airconController'],
                output: {
                    path: path.resolve(__dirname, output_path),
                    filename: 'index.js',
                    libraryTarget: 'this',
                },
            },
            commonConfig
        ),
    ].concat(
        functions.map((f) =>
            Object.assign(
                {
                    target: 'node',
                    entry: `./src/${f}/index.ts`,
                    externals: [nodeExternals()],
                    output: {
                        path: path.resolve(__dirname, output_path, f),
                        filename: 'index.js',
                        libraryTarget: 'this',
                    },
                },
                commonConfig
            )
        )
    );
};
