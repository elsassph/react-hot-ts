const createProxy = require('react-proxy').createProxy;
const forceUpdate = require('react-deep-force-update');

const proxies = (global._hmr_proxies_ = global._hmr_proxies_ || {});
let dirtyTimer;
let dirtyCallback;

function notify() {
	dirtyCallback && dirtyCallback(forceUpdate(require('react')));
}

// allow handling events directly
function listen(cb) {
	dirtyCallback = cb;
}

// hot helper
function hot(module) {
	return function(node) {
		if (module.hot) {
			module.hot.accept();
			listen(function(forceUpdate) {
				forceUpdate(node);
			});
		}
		return node;
	}
}

// register declaration with the HMR proxy
function register(type, name, source, decl) {
	if (!decl.name && !decl.displayName) decl.displayName = name;

	const key = name + type + '@' + source;
	let proxy = proxies[key];
	if (!proxy) {
		proxy = proxies[key] = type ? createFunctionProxy(key, decl) : createProxy(decl);
	} else {
		proxy.update(decl);
		clearTimeout(dirtyTimer);
		dirtyTimer = window.setTimeout(notify, 10);
	}

	return proxy.get();
}

function createFunctionProxy(key, fn) {
	// named proxy function
	const wrapper = function(props) {
		return proxies[key].fn(props);
	};
	Object.defineProperty(wrapper, 'name', { value: fn.name, writable: false });
	wrapper.displayName = fn.displayName;

	const proxy = {
		fn: fn,
		update: function(fn) {
			this.fn = fn;
		},
		get: function() {
			return wrapper;
		}
	};
	return (proxies[key] = proxy);
}

// expose default / listen
register.listen = listen;
register.hot = hot;
module.exports = register;
