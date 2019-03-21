const path = require('path');
const webpack = require('webpack');
const hmrTransformer = require('./lib/transformer');

const isProd = process.env.NODE_ENV === "production";

module.exports = env => ({
    mode: isProd ? "production" : "development",
    target: "node",
    devtool: "source-map",
    entry: "./test/src/spec.ts",
    output: {
        path: path.join(__dirname, 'test/dist'),
        filename: "test.js"
    },
    optimization: {
        minimize: false
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "react": path.resolve('test/src/react'),
            "react-hmr-ts/cold.js": path.resolve("./cold.js"),
            "react-hmr-ts": path.resolve("./index.js")
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    compilerOptions: {
                        target: env && env.es6 ? "es6" : "es5",
                    },
                    getCustomTransformers
                }
            }
        ]
    },
    plugins: isProd ? [] : [
        new webpack.HotModuleReplacementPlugin()
    ]
});

function getCustomTransformers() {
    return {
        before: [hmrTransformer({
            hmrRuntime: path.resolve('test/src/runtime')
        })]
    };
}
