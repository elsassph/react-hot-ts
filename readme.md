# React HMR for TypeScript

Add React Hot Module Replacement in your TypeScript project:

- **No Babel, no plugin!**
- This is **TypeScript-native**, using a fancy compile-time AST transformer,
- Supports both React component classes AND functional components,
- [Webpack][1] + [ts-loader][2] ready, but can support other bundlers and loaders with sufficient HMR / transformer APIs,
- Reliable HMR feature based on Dan Abramov's [react-proxy][3],
- **Bonus:** ensures React functions and classes have a `name`, for enhanced debugging experience!

[1]: https://webpack.js.org
[2]: https://github.com/TypeStrong/ts-loader
[3]: https://github.com/gaearon/react-proxy

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

2. Configure the TypeScript loader with a custom transformer

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

### Attention NODE_ENV

You must set the `NODE_ENV` environement (e.g. `process.env.NODE_ENV`) to `"development"` otherwise the transform won't be operational.

Note: Webpack's `mode` is [not sufficient](https://github.com/webpack/webpack/issues/7074).

If your `NODE_ENV` isn't correctly set you will see this message in the console:
```
[react-hmr-ts] ERROR!
[react-hmr-ts] `process.env.NODE_ENV` is `undefined`
[react-hmr-ts] Ensure `process.env.NODE_ENV` is set to "development" for operation
```

### Transformer options

You can pass options to `hmrTransformer(options)`, where `options` is an object with optional fields:

- `proxyModule`: module `require`'d by the wrapper HMR proxy (if you want to provide an alternative/instrumented proxy implementation)
- `proxyWrapper`: name of the generated HMR wrapper (if the `_hmr_proxy_` name is problematic)
- `reactBaseClasses`: list of base class names considered for React components, if you use custom base classes for your React components (default: `['Component', 'React.Component', 'React.PureComponent']`)

Example:

```javascript
hmrTransformer({
    reactBaseClasses: ['React.Component', 'MyFrameworkBaseComponent']
})
```

## React usage

Once the transformation is in place, you need to add the re-render logic in your application root, e.g. where you will call `ReactDOM.render`:

```typescript
// use variable defined by Webpack, or your own
declare const NODE_ENV: string;

// accept HMR for any child
if (module.hot) module.hot.accept();

// keep a reference of the rendered application
const appRoot = ReactDOM.render(<App/>);

// listen for updates and force re-render the application
if (NODE_ENV === 'development') {
    require('react-hmr-ts').listen(getForceUpdate => {
        const forceUpdate = getForceUpdate(React);
        forceUpdate(appRoot);
    });
}
```

Run Webpack dev server and enjoy live component updates!

## Known issues

### Functional components without `props` parameter

Currently the transformer has a limitation: functional components **must** be declared with a `props` parameter:

```typescript
// OK
function renderText(props) {
    return <div>{props.text}</div>;
}

// Nope
function renderText({ text }) {
    return <div>{text}</div>;
}

// Nope
function renderText() {
    return <div>Hardcoded text</div>;
}
```

**Workaround** is to use `prop` as argument.

### "Recursive" static class field initializers

An issue in TypeScript code generation prevents static fields values referencing other static fields of the same class:

```typescript
class RecursiveStatic {
    static A = { name: 'a' };
    static B = {
        name: 'b',
        value: RecursiveStatic.A // <- fails at run time
    };

    constructor() {
        /* etc. */
    }
}
```

**Workaround** is to declare the statics outside the class, or set `B.value` after the declaration of the class.

## ISC License

Copyright 2019 Philippe Elsass

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
