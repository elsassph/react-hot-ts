//
// FuseBox HMR runtime for `react-hmr-ts`
//
import 'fuse-box/modules/fuse-loader/LoaderAPI';
import { hot as refHot } from 'react-hmr-ts';

declare namespace global { let __hmrRegistered: boolean; }

export function hot(module: NodeModule) {
    if (typeof FuseBox === "undefined" || global.__hmrRegistered) {
        return (component: any) => component;
    }
    global.__hmrRegistered = true;

    FuseBox.addPlugin({
        hmrUpdate: ({ type, path, content }) => {
            if (type === "js" && path.endsWith('.tsx')) {
                // if index changes, reload page
                const qualified = `default/${path}`;
                if (FuseBox.mainFile === qualified) {
                    setTimeout(() => document.location.reload(), 0);
                    return false;
                }
                // otherwise re-execute changed module to update components
                FuseBox.flush();
                FuseBox.dynamic(path, content);
                FuseBox.import(qualified);
                return true;
            }
        },
    });
    return refHot(module);
}
