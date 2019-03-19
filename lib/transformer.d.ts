import * as ts from 'typescript';
/**
 * HMR transformer options:
 * - proxyModule: module required by the client HMR proxy
 * - proxyWrapper: generated HMR wrapper function name
 * - reactBaseClasses: list of base class names considered for React components
 */
declare type HMRTransformerOptions = {
    proxyModule?: string;
    proxyWrapper?: string;
    reactBaseClasses?: string[];
};
/**
 * TypeScript AST transformer
 * Wraps React classes and functional components for HMR
 */
declare function hmrTransformer(options: HMRTransformerOptions): typeof prodTransformer;
declare function prodTransformer(context: ts.TransformationContext): (node: ts.Node) => ts.Node;
export = hmrTransformer;
