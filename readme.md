# React hot loader for TypeScript

A lightweight, Typescript-native, Babel-free, plugin-free, implementation of [react-hot-loader][1].

Add React hot-reload (live update without losing state) in your TypeScript projects!

## Supported bundlers

- [Webpack][2] + [ts-loader][3]
- [FuseBox][4]

## Features

- Compile-time transformation is done using a TypeScript compiler hook,
- Supports both React component classes and functional components,
- Reliable hot-reload feature based on Dan Abramov's [react-proxy][5] (for ES5) or [react-stand-in][6] for ES6 (needs alias),
- Support both ES5 and ES6 compilation targets.

## Bonus

- Rewrites arrow functions to be hot-reload friendly (can be opt-out),
- Ensures React functions and classes have a "display name", for enhanced debugging experience.

[1]: https://github.com/gaearon/react-hot-loader
[2]: https://webpack.js.org
[3]: https://github.com/TypeStrong/ts-loader
[4]: https://fuse-box.org/
[5]: https://github.com/gaearon/react-proxy
[6]: https://github.com/theKashey/react-stand-in

## Installation

```
npm install react-hot-ts -D
```
Or
```
yarn add react-hot-ts -D
```

## Webpack configuration

Just 2 steps:

1. Make your Webpack configuration "hot" for development

    See guide: https://webpack.js.org/guides/hot-module-replacement/#enabling-hmr

2. Configure the TypeScript loader with a custom transformer (you can keep it in your production builds)

```javascript
const { rhTransformer } = require('react-hot-ts');
/*...*/

module.exports = {
    /*...*/
    rules: [
        {
            test: /\.tsx?$/,
            use: [{
                loader: 'ts-loader',
                options: {
                    // enable TS transformation
                    getCustomTransformers: {
                        before: [ rhTransformer() ]
                    }
                }
            }]
        }
        /*...*/
    ]
    /*...*/
}
```

### Transformer options

Although they shouldn't be needed for normal use cases, the transformers has a few options:

Usage: `rhTransformer(options)`

Where `options` is an object with the following optional fields:

- `disable`: force release mode, disregarding `NODE_ENV` value,
- `keepArrows`: opt-out of arrow functions rewriting; this can avoid a lot of extra code (and maybe subtle issues) when targeting ES5 instead of ES6,
- `rhRuntime`: (advanced) specify an alternative module to be required for the client hot-loading runtime logic.

Example: `rhTransformer({ keepArrows: true })`

### Attention NODE_ENV

You must set the `NODE_ENV` environment (e.g. `process.env.NODE_ENV`) to `"production"` to disable the transform.
You will see this message in the console:
```
[react-hot-ts] disabled for production
```
*Note: Webpack's `mode` is [not sufficient](https://github.com/webpack/webpack/issues/7074).*

## React usage

Once the compiler transformation is in place, you just need to wrap your root `ReactDOM.render` call:

```jsx
import { hot } from 'react-hot-ts';

hot(module)( ReactDOM.render(<App/>) );
```

When building for release, only the HMR runtime will be replaced by a no-op.

Now run Webpack dev server and enjoy live component updates!

## Known issues

### Targeting ES6

If you target ES6 with the TypeScript compiler, you will run into runtime errors like:

    Uncaught TypeError: Cannot convert undefined or null to object

The reason is that `react-proxy` isn't ES6-friendly, and the solution is to install `react-stand-in`
and add an alias in your bundler to remap the former:

- https://webpack.js.org/configuration/resolve/#resolvealias
- https://fuse-box.org/docs/development/configuration#alias

### Only `.tsx` files are considered

If you use `.ts` and manual `React.createComponent` code, it won't be registered for HMR.

**Workaround** is to use `.tsx` ;)

### Passing non-exported React classes/functions references

Non-exported class or function won't be reloaded if their reference is kept outside the module.

```jsx
// A.js
class A extends Component {...};
export function provideA() {
    return A;
}

// B.js
import {provideA} from 'A';
export class B extends Component {
    private ARef;
    constructor() {
        this.ARef = provideA();
    }
    render() {
        return <ARef/>;
    }
}
```

**Workaround** is to export the class/function even if it won't be used from exports.

## ISC License

Copyright 2019 Philippe Elsass

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
