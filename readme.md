# React HMR for TypeScript

A lightweight, Typescript-native, Babel-free, plugin-free, implementation of [react-hot-loader][1].

Add React Hot Module Replacement in your TypeScript / Webpack projects!:

- Compile-time transformation is done using a TypeScript compiler hook,
- Supports both React component classes and functional components,
- [Webpack][2] + [ts-loader][3] ready, but can support other bundlers and loaders with sufficient HMR / transformer APIs,
- Reliable HMR feature based on Dan Abramov's [react-proxy][4] (note: you should alias it to [react-stand-in][5] when targeting ES6),
- Support both ES5 and ES6 compilation targets.

**Bonus:**

- rewrites arrow functions to be hot-reload friendly (can be opt-out),
- ensures React functions and classes have a "display name", for enhanced debugging experience.

[1]: https://github.com/gaearon/react-hot-loader
[2]: https://webpack.js.org
[3]: https://github.com/TypeStrong/ts-loader
[4]: https://github.com/gaearon/react-proxy
[5]: https://github.com/theKashey/react-stand-in

## Installation

```
npm install react-hmr-ts -D
```
Or
```
yarn add react-hmr-ts -D
```

## Webpack configuration

Just 2 steps:

1. Make your Webpack configuration "hot" for development

    See guide: https://webpack.js.org/guides/hot-module-replacement/#enabling-hmr

2. Configure the TypeScript loader with a custom transformer (you can keep it in your production builds)

```javascript
const hmrTransformer = require('react-hmr-ts/lib/transformer');
/*...*/

module.exports = {
    /*...*/
    rules: [
        {
            test: /\.tsx?$/,
            use: [{
                loader: 'ts-loader',
                options: {
                    // enable TS HMR transformation
                    getCustomTransformers: {
                        before: [ hmrTransformer() ]
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

Usage: `hmrTransformer(options)`

Where `options` is an object with the following optional fields:

- `keepArrows`: opt-out of arrow functions rewriting; this can avoid a lot of extra code (and maybe subtle issues) when targeting ES5 instead of ES6,
- `hmrRuntime`: (advanced) specify an alternative module to be required for the client HMR runtime logic.

Example: `hmrTransformer({ keepArrows: true })`

### Attention NODE_ENV

You must set the `NODE_ENV` environment (e.g. `process.env.NODE_ENV`) to `"production"` to disable the transform.
You will see this message in the console:
```
[react-hmr-ts] disabled for production
```
*Note: Webpack's `mode` is [not sufficient](https://github.com/webpack/webpack/issues/7074).*

## React usage

Once the compiler transformation is in place, you just need to wrap your root `ReactDOM.render` call:

```typescript
import { hot } from 'react-hmr-ts';

hot(module)( ReactDOM.render(<App/>) );
```

When building for release, only the HMR runtime will be replaced by a no-op.

Now run Webpack dev server and enjoy live component updates!

## Known issues

### Only `.tsx` files are considered

If you use `.ts` and manual `React.createComponent` code, it won't be registered for HMR.

**Workaround** is to use `.tsx` ;)

### Passing non-exported React classes/functions references

Non-exported class or function won't be reloaded if their reference is kept outside the module.

```typescript
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
