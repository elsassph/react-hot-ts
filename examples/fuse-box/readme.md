# FuseBox example

A minimal [FuseBox][1] + Typescript + React with hot reload using [react-hot-ts][2].

Thanks to `react-hot-ts`:

- React component can be hot-reloaded without state loss,
- Components reload deep behind `PureComponent/shouldComponentUpdate`,
- And even arrow function fields can reload.

The example doesn't include any resources loading (e.g. CSS, images...).

[1]: https://fuse-box.org/
[2]: https://github.com/elsassph/react-hot-ts

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
node fuse
```

## Release

Look into [QuantumPlugin][1] and [Sparky][2].

[1]: https://fuse-box.org/docs/production-builds/quantum
[2]: https://fuse-box.org/docs/task-runner/getting-started-with-sparky
