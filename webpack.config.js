const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: "development",
    target: "node",
    devtool: "source-map",
    entry: "./test/src/spec.ts",
    output: {
        path: path.join(__dirname, 'test/dist'),
        filename: "test.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    getCustomTransformers
                }
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};

function getCustomTransformers() {
    return {
        before: [require('./lib/transformer')({
            proxyModule: path.resolve('test/src/proxy')
        })]
    };
}
