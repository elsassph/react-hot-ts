import * as ts from 'typescript';

const PROXY_MODULE = 'react-hmr-ts';
let proxyModule: string;

/**
 * HMR transformer options:
 * - proxyModule: module required by the client HMR proxy
 */
type HMRTransformerOptions = {
	proxyModule?: string;
}

/**
 * TypeScript AST transformer
 * Wraps React classes and functional components for HMR
 */
function hmrTransformer(options: HMRTransformerOptions): (context: ts.TransformationContext) => ts.Visitor {
	// do nothing if not `development`
	const env = process.env.NODE_ENV;
	if (env !== 'development') {
		if (env === undefined) {
			console.error('[react-hmr-ts] ERROR!');
			console.error('[react-hmr-ts] `process.env.NODE_ENV` is `undefined`');
			console.error('[react-hmr-ts] Ensure `process.env.NODE_ENV` is set to "development" for operation');
		} else {
			console.log('[react-hmr-ts] disabled for', env);
		}
		return prodTransformer;
	}

	applyOptions(options);
	return devTransformer;
}

/**
 * Production transformer replaces the HMR logic with a no-op
 */
function prodTransformer(context: ts.TransformationContext) {
	const visitor = (node: ts.Node) => {
		if (ts.isSourceFile(node)) {
			const imports: ({ text: string })[] = (node as any).imports;
			// replace `react-hmr-ts` imports by a cold version for production
			if (imports && imports.find(imp => imp.text === 'react-hmr-ts')) {
				const statements = node.statements.map(s => {
					if (ts.isImportDeclaration(s)
						&& ts.isStringLiteral(s.moduleSpecifier)
						&& s.moduleSpecifier.text === 'react-hmr-ts'
					) {
						return ts.updateImportDeclaration(s,
							s.decorators, s.modifiers, s.importClause,
							ts.createStringLiteral('react-hmr-ts/cold.js'));
					} else return s;
				});
				return ts.updateSourceFileNode(node, statements);
			}
		}
		return node;
	};
	return (node: ts.Node) => ts.visitNode(node, visitor);
}

/**
 * Development transformer registers all the module exports (of TSX files)
 * so that they can be proxied and updated live if they happen
 * to be React components/functions
 */
function devTransformer(context: ts.TransformationContext) {
	const visitor = (node: ts.Node) => {
		if (isSourceFileObject(node) && !shouldSkipSourceFile(node)) {
			// add exports registration
			const statements: ts.Statement[] = [
				...node.statements,
				ts.createEmptyStatement(),
				ts.createStatement(ts.createImmediatelyInvokedFunctionExpression([
					...createHotStatements(node.fileName),
					...createRegistrations(node.symbol.exports)
				]))
			];
			return ts.updateSourceFileNode(node, statements);
		}
		return node;
	};
	return (node: ts.Node) => ts.visitNode(node, visitor);
}

/**
 * Apply defaults and user options
 */
function applyOptions(options: HMRTransformerOptions) {
	proxyModule = PROXY_MODULE;
	if (!options) return;

	if (options.proxyModule) {
		proxyModule = options.proxyModule;
	}
}

function shouldSkipSourceFile(node: SourceFileObject) {
	if (node.__explored__) return true;
	node.__explored__ = true;
	return node.isDeclarationFile || !node.fileName.endsWith('.tsx') || node.symbol.exports.size == 0;
}

function createHotStatements(fileName): ts.Statement[] {
	return reify(`
		if (module.hot) module.hot.accept();
		const register = require('${proxyModule}').register;
		const fileName = "${fileName}";
		const exports = typeof __webpack_exports__ !== "undefined" ? __webpack_exports__ : module.exports;
	`);
}

function createRegistrations(exports: Map<string, SymbolObject>): ts.Statement[] {
	const statements = [];
	const names: { [name: string]: number } = {};

	exports.forEach((value, key) => {
		// find the declaration name
		let name = getValueName(value.valueDeclaration) || value.name || key;
		if (name === 'default' && value.declarations) {
			const declName = getDeclName(value.declarations[0]);
			if (declName) name = declName;
		}
		// ensure unique locally
		if (names[name]) {
			name = `${name}_${names[name]++}`;
		} else {
			names[name] = 1;
		}
		// generate registration
		statements.push(
			reify(`register(exports.${key}, "${name}", fileName)`)[0]
		);
	});
	return statements;
}

function getValueName(node: ts.NamedDeclaration) {
	return (node && node.name && node.name.kind === ts.SyntaxKind.Identifier && node.name.text) || undefined;
}

function getDeclName(decl: ts.Node) {
	return decl && ts.isExportAssignment(decl) && ts.isIdentifier(decl.expression)
		? decl.expression.text : undefined;
}

/* Extra typing of intermediary AST objects */

function isSourceFileObject(node: ts.Node): node is SourceFileObject {
	return ts.isSourceFile && node.hasOwnProperty('symbol');
}

interface SymbolObject extends ts.Node {
	name: string;
	valueDeclaration?: ts.NamedDeclaration;
	exports?: Map<string, SymbolObject>;
	declarations?: ts.Node[];
	members?: ts.Node[];
}

interface SourceFileObject extends ts.SourceFile {
	__explored__?: boolean;
	symbol: SymbolObject;
}

/* Reification helper: create AST from source */

const reified: { [source: string]: ts.Statement[] } = {};

function reify(source: string, noCache?: boolean): ts.Statement[] {
	if (!noCache && reified[source]) {
		return reified[source];
	}
	const sourceFile: ts.SourceFile = ts.createSourceFile(
		'template.ts', source, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS
	);
	const result = Array.prototype.filter.call(sourceFile.statements, s => !ts.isEmptyStatement(s));
	anonymize(result);
	if (!noCache) reified[source] = result;
	return result;
}

// Remove position information from nodes, otherwise broken code is generated
function anonymize(o: any) {
	if (o.kind) o.pos = o.end = -1;
	for (let p in o) {
		if (p === 'parent' || !o.hasOwnProperty(p)) continue;
		const v = o[p];
		const t = typeof v;
		if (t === 'object') anonymize(v);
	}
}

export = hmrTransformer;
