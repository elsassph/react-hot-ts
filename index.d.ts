type GetForceUpdate = (React: any) => ((component: any) => void);
type HMRCallback = (getForceUpdate: GetForceUpdate) => void;

/**
 * Set update callback after React HMR
 */
export function listen(callback: HMRCallback);
