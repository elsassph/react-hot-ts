const path = require('path');
const hmrTransformer = require('react-hmr-ts/lib/transformer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
    devtool: PROD ? undefined : 'source-map',
    entry: './src/index.tsx',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'app.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            // 'react-proxy': 'react-stand-in' // for ES6
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true, // -> ForkTsCheckerPlugin
                    getCustomTransformers
                }
            }
        ]
    },
    plugins: PROD ? getProdPlugins() : getDevPlugins()
};

function getCustomTransformers() {
    return {
        before: [hmrTransformer()]
    };
}

function getProdPlugins() {
    return [
        new HtmlWebpackPlugin(),
        new ForkTsCheckerPlugin({
            compilerOptions: {
                noUnusedLocals: true
            }
        })
    ];
}

function getDevPlugins() {
    return [
        new HtmlWebpackPlugin(),
        new ForkTsCheckerPlugin({
            watch: path.resolve('src'),
            compilerOptions: {
                noUnusedLocals: false
            }
        })
    ];
}
