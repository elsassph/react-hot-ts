# Webpack 4 example

A minimal [Webpack][1] + Typescript + React with hot reload using [react-hmr-ts][2].

Thanks to `react-hmr-ts`:

- React component can be hot-reloaded without state loss,
- Components reload deep behind `PureComponent/shouldComponentUpdate`,
- And even arrow function fields can reload.

The example doesn't include any resources loading (e.g. CSS, images...).

[1]: https://webpack.js.org/
[2]: https://github.com/elsassph/react-hmr-ts

## Installation

Install dependencies using your prefered module management tool:

```
npm i
```
or
```
yarn
```

## Development

Automatic dev server with hot module replacement:

```
npm start
```

Static development build with sourcemaps:

```
npm run dev
```

## Release

Static production build:

```
npm run build
```
