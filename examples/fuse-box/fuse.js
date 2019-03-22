const hmrTransformer = require('react-hmr-ts/lib/transformer');

const { FuseBox, WebIndexPlugin } = require('fuse-box');
const fuse = FuseBox.init({
    homeDir : "src",
    output : "dist/$name.js",
    target : "browser",
    sourceMaps : true,
    plugins : [
        WebIndexPlugin()
    ],
    // Install `react-stand-in` and enable the `react-proxy` alias if targeting ES6
    alias: {
        // "react-proxy": "react-stand-in"
    },
    // React HMR uses a compiler transformation
    transformers: {
        before: [hmrTransformer()]
    }
});
fuse.dev();

fuse.bundle("app")
    .watch()
    .hmr()
    .instructions(" > index.tsx");
fuse.run();
