const path = require('path');
const nodeExternals = require('webpack-node-externals');
const glob = require('glob');

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
const commands = glob.sync('./src/**/commands/*.ts').map((v) => {
    const parsed = path.parse(v);
    const trimIndex = parsed.dir.split(path.sep).indexOf('src');
    const structuredDir = parsed.dir.split(path.sep).slice(trimIndex + 1);
    return {
        entry: v,
        output: {
            path: path.resolve(__dirname, output_path, ...structuredDir),
            filename: `${parsed.name}.js`,
            libraryTarget: 'commonjs',
        },
    };
});

const webpackOptions = (env, argv) =>
    [
        Object.assign(
            {
                target: 'node',
                entry: './src/index.ts',
                externals: [nodeExternals()].concat(functions.map((f) => `./${f}/index`)),
                output: {
                    path: path.resolve(__dirname, output_path),
                    filename: 'index.js',
                    libraryTarget: 'commonjs',
                },
            },
            commonConfig
        ),
    ]
        .concat(
            functions.map((f) =>
                Object.assign(
                    {},
                    {
                        target: 'node',
                        entry: `./src/${f}/index.ts`,
                        externals: [nodeExternals(), /commands/],
                        output: {
                            path: path.resolve(__dirname, output_path, f),
                            filename: 'index.js',
                            libraryTarget: 'commonjs',
                        },
                    },
                    commonConfig
                )
            )
        )
        .concat(
            commands.map((c) =>
                Object.assign(
                    {
                        target: 'node',
                        externals: [nodeExternals()],
                    },
                    c,
                    commonConfig
                )
            )
        );

module.exports = function(env, argv) {
    return webpackOptions(env, argv);
};
