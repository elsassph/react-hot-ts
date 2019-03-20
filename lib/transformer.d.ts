import * as ts from 'typescript';
/**
 * HMR transformer options:
 * - proxyModule: module required by the client HMR proxy
 * - keepArrows: leave arrow functions not re-wired to prototype
 */
declare type HMRTransformerOptions = {
    proxyModule?: string;
    keepArrows?: boolean;
};
/**
 * TypeScript AST transformer
 * Wraps React classes and functional components for HMR
 */
declare function hmrTransformer(options: HMRTransformerOptions): (context: ts.TransformationContext) => ts.Visitor;
export = hmrTransformer;
