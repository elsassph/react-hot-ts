import * as ts from 'typescript';
/**
 * HMR transformer options:
 * - proxyModule: module required by the client HMR proxy
 */
declare type HMRTransformerOptions = {
    proxyModule?: string;
};
/**
 * TypeScript AST transformer
 * Wraps React classes and functional components for HMR
 */
declare function hmrTransformer(options: HMRTransformerOptions): (context: ts.TransformationContext) => ts.Visitor;
export = hmrTransformer;
