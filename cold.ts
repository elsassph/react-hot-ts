/*
 * No-op HMR runtime
 */

function noop() {}
function hot(module: any) {
  return function (component: any) {
    return component;
  }
}

export default {
  register: noop,
  listen: noop,
  hot
}
