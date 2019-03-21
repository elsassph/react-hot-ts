export function register(decl, name, source) {
    console.log('+', name, source, typeof decl, decl.name);
}

export function hot(module) {
    return function(component) {
        patchReact();
        return component;
    }
}

function patchReact() {
    const React = require('react');
    React._hmr_createElement = React.createElement;
    React.createElement = function() {
        return 'patched';
    }
}
