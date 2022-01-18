/*
 * React hot reload runtime
 */

interface ReactProxy {
	get(): any;
	update(type: any): void;
}

type ReactProxies = { [id: string]: ReactProxy };

type HotCallback = (forceUpdate: (element: any) => void) => void;

type WebModule = NodeModule & {
	hot?: { accept: () => void }
};

// supporting either `react-proxy` or `react-stand-in` aliasing for ES6
let reactProxy = require('react-proxy');
const createProxy = reactProxy.default || reactProxy.createProxy;
const getForceUpdate = require('react-deep-force-update');

const g: { _hmr_proxies_?: ReactProxies } = global as any;
const proxies = (g._hmr_proxies_ = g._hmr_proxies_ || {});
let updateTimer: number = 0;
let updateCallback: HotCallback;

export * from './lib/transformer';

/** Notification that some component was updated */
export function listen(cb: HotCallback) {
	if (updateTimer) resetTimer();
	updateCallback = cb;
}

/** Hot update helper */
export function hot(
	module?: WebModule,
	accept?: (module: WebModule, proxies: ReactProxies) => void
) {
	if (accept) {
		accept(module!, proxies);
	} else if (module && module.hot) {
		module.hot.accept();
	}

	return function(element: any) {
		listen(function(forceUpdate) {
			forceUpdate(element);
		});
		return element;
	}
}

/** Register types to be proxied - name must be unique for the fileName */
export function register(type: any, name: string, fileName: string) {
	if (typeof type !== 'function') return;

	// enable react components proxying
	patchReact();

	// ensure display name
	if (!type.name && !type.displayName && name !== 'default') {
		type.displayName = name;
	}

	// tag type
	const key = name + '@' + fileName;
	type._proxy_id_ = key;

	// create/update proxy
	const proxy = proxies[key];
	if (proxy) {
		proxy.update(type);
		resetTimer();
	}
}

function resetTimer() {
	clearTimeout(updateTimer);
	updateTimer = window.setTimeout(notify, 100);
}

function notify() {
	updateTimer = 0;
	updateCallback && updateCallback(getForceUpdate(require('react')));
}

function patchReact() {
	const React = require('react');
	if (!!React._hmr_createElement) return;
	React._hmr_createElement = React.createElement;
	// override createElement to return the proxy
	React.createElement = function() {
		const type = arguments[0];
		if (typeof type === 'function' && type._proxy_id_) {
			let proxy = proxies[type._proxy_id_];
			if (!proxy) {
				proxy = proxies[type._proxy_id_] = createProxy(type);
			}
			const args = Array.prototype.slice.call(arguments, 1);
			args.unshift(proxy.get());
			return React._hmr_createElement.apply(React, args);
		}
		return React._hmr_createElement.apply(React, arguments);
	}
}
