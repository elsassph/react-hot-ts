const createProxy = require('react-proxy').createProxy;
const getForceUpdate = require('react-proxy').getForceUpdate;

const proxies = (global._hmr_proxies_ = global._hmr_proxies_ || {});
let dirtyTimer;
let dirtyCallback;

function notify() {
	dirtyCallback && dirtyCallback(getForceUpdate);
}

function listen(cb) {
	dirtyCallback = cb;
}

// wrap/register declaration with the HMR proxy
function wrap(type, name, source, decl) {
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
wrap.listen = listen;
module.exports = wrap;
