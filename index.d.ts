type ProvideComponent = (component: any) => void;
type HMRCallback = (forceUpdate: ProvideComponent) => void;

/**
 * Set update callback after React HMR
 */
export function listen(callback: HMRCallback);

/**
 * Wrap component for automatic re-render
 */
export function hot(module: NodeModule): ProvideComponent;
