// Production replacement for the HMR feature
function noop() {}
noop.listen = function listen() {}
noop.hot = function hot(module) {
    return function(component) {
        return component;
    }
}
module.exports = noop;
