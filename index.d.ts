type ProvideComponent = (component: any) => void;
type HMRCallback = (forceUpdate: ProvideComponent) => void;
type AcceptHMR = (module: NodeModule, proxies: { [key: string]: any }) => void;

/**
 * Set update callback after React HMR
 */
export function listen(callback: HMRCallback): void;

/**
 * Wrap component for automatic re-render
 */
export function hot(module?: NodeModule, accept?: AcceptHMR): ProvideComponent;
