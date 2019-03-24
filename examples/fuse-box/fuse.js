
const { FuseBox, WebIndexPlugin } = require('fuse-box');
const hmrTransformer = require('react-hmr-ts/lib/transformer');

const fuse = FuseBox.init({
    homeDir : "src",
    output : "dist/$name.js",
    target : "browser",
    sourceMaps : true,
    plugins : [
        WebIndexPlugin()
    ],
    alias: {
        // If targeting ES6+, install `react-stand-in` and alias `react-proxy`:
        // "react-proxy": "react-stand-in"
    },
    transformers: {
        // React HMR using a compiler transformation
        before: [hmrTransformer()]
    }
});
fuse.dev();

fuse.bundle("app")
    .watch()
    .hmr()
    .instructions("> index.tsx");
fuse.run();
