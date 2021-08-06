import * as path from 'path';
import * as webpack from 'webpack';
import { rhTransformer } from './lib/transformer';

const isProd = process.env.NODE_ENV === "production";

export default (env: any) => ({
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
      "react-hot-ts/cold.js": path.resolve("./cold.ts"),
      "react-hot-ts": path.resolve("./index.js")
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: path.resolve('test/src/tsconfig.json'),
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
    before: [rhTransformer({
      rhRuntime: path.resolve('test/src/runtime')
    })]
  };
}
