/*
 * HMR runtime
 */

let reactProxy = require('react-proxy'); // could be aliased to `react-stand-in`
const createProxy = reactProxy.default || reactProxy.createProxy;
const getForceUpdate = require('react-deep-force-update');

const proxies = (global._hmr_proxies_ = global._hmr_proxies_ || {});
let dirtyTimer;
let dirtyCallback;

function notify() {
	dirtyCallback && dirtyCallback(getForceUpdate(require('react')));
}

// allow handling events directly
function listen(cb) {
	dirtyCallback = cb;
}

// hot helper
function hot(module, accept) {
	patchReact();

	if (accept) {
		accept(module, proxies);
	} else if (module && module.hot) {
		module.hot.accept();
	}

	return function(node) {
		listen(function(forceUpdate) {
			forceUpdate(node);
		});
		return node;
	}
}

// register declaration with the HMR proxy
function register(type, name, source) {
	if (typeof type !== 'function') return;

	// ensure display name
	if (!type.name && !type.displayName && name !== 'default') {
		type.displayName = name;
	}

	// tag type
	const key = name + '@' + source;
	type._proxy_id_ = key;

	// create/update proxy
	const proxy = proxies[key];
	if (proxy) {
		proxy.update(type);
		clearTimeout(dirtyTimer);
		dirtyTimer = window.setTimeout(notify, 10);
	}
}

function patchReact() {
	const React = require('react');
	if (!!React._hmr_createElement) return;
	React._hmr_createElement = React.createElement;
	// override createElement to return the proxy
	React.createElement = function() {
		let args = arguments;
		const type = args[0];
		if (typeof type === 'function' && type._proxy_id_) {
			let proxy = proxies[type._proxy_id_];
			if (!proxy) {
				proxy = proxies[type._proxy_id_] = createProxy(type);
			}
			args = Array.prototype.slice.call(arguments, 1);
			args.unshift(proxy.get());
		}
		return React._hmr_createElement.apply(React, args);
	}
}

module.exports = {
	register,
	listen,
	hot
};
