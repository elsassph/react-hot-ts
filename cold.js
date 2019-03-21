/*
 * No-op HMR runtime
 */

function noop() {}
function hot(module) {
    return function(component) {
        return component;
    }
}

module.exports = {
    register: noop,
    listen: noop,
    hot
}
