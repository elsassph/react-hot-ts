import * as ts from 'typescript';

const PROXY_MODULE = 'react-hmr-ts';
const PROXY_WRAPPER = '_hmr_proxy_';
const REACT_BASE_CLASSES = ['Component', 'React.Component', 'React.PureComponent'];

let proxyModule: string;
let proxyWrapper: string;
let reactBaseClasses: string[];

/**
 * HMR transformer options:
 * - proxyModule: module required by the client HMR proxy
 * - proxyWrapper: generated HMR wrapper function name
 * - reactBaseClasses: list of base class names considered for React components
 */
type HMRTransformerOptions = {
	proxyModule?: string;
	proxyWrapper?: string;
	reactBaseClasses?: string[];
}

/**
 * TypeScript AST transformer
 * Wraps React classes and functional components for HMR
 */
function hmrTransformer(options: HMRTransformerOptions) {
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

function prodTransformer(context: ts.TransformationContext) {
	const visitor = (node: ts.Node) => {
		// visit files
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

function devTransformer(context: ts.TransformationContext) {
	let fileName: string;
	let addDefaults: string[];
	let makeHot: boolean;

	const visitor = (node: ts.Node) => {
		if (ts.isSourceFile(node)) {
			if (skipSourceFile(node)) return node;
			// we'll visit children
			fileName = node.fileName;
			addDefaults = [];
			const visitedSource: ts.SourceFile = ts.visitEachChild(node, visitor, context);
			// generate extra code
			const statements = [
				...hotStatements(makeHot),
				...visitedSource.statements,
				...addDefaults.map(name => {
					return ts.createExportDefault(ts.createIdentifier(name));
				})
			];
			const newSource = ts.updateSourceFileNode(visitedSource, statements);
			// const printer = ts.createPrinter();
			// console.log(printer.printFile(newSource));
			return newSource;
		} else if (ts.isArrowFunction(node)) {
			if (isReactFunction(node)) {
				makeHot = true;
				return wrapArrowFunction(node, fileName);
			} else return node;
		} else if (ts.isFunctionExpression(node)) {
			if (isReactFunction(node)) {
				makeHot = true;
				return wrapFunctionExpression(node, fileName);
			} else return node;
		} else if (ts.isFunctionDeclaration(node)) {
			if (isReactFunction(node)) {
				makeHot = true;
				return wrapFunctionDeclaration(node, fileName, addDefaults);
			} else return node;
		} else if (ts.isClassExpression(node)) {
			if (isReactClass(node)) {
				makeHot = true;
				return wrapClassExpression(node, fileName);
			}
		} else if (ts.isClassDeclaration(node)) {
			if (isReactClass(node)) {
				makeHot = true;
				return wrapClassDeclaration(node, fileName, addDefaults);
			}
			return node;
		} else if (ts.isVariableStatement(node) || ts.isVariableDeclarationList(node) || ts.isVariableDeclaration(node)) {
			// recurse-visit top-level variables declarations
			return ts.visitEachChild(node, visitor, context);
		}
		return node;
	};
	return (node: ts.Node) => ts.visitNode(node, visitor);
}

// match `class X extends Component`
function wrapClassDeclaration(node: ts.ClassDeclaration, fileName: string, addDefaults: string[]) {
	const name = getName(node);
	// remove `export default` modifier into a separate const statement
	const modifiers = node.modifiers;
	const isDefault = removeDefault(modifiers);
	if (isDefault) addDefaults.push(name);
	// convert to `X = class X extends Component`
	const c = ts.createClassExpression(modifiers, name, node.typeParameters, node.heritageClauses, node.members);
	return ts.createVariableStatement(
		modifiers,
		ts.createVariableDeclarationList([
			ts.createVariableDeclaration(name, undefined, wrapClass(fileName, c, name))
		])
	);
}

// match `X = class extends React.Component`
function wrapClassExpression(node: ts.ClassExpression, fileName: string) {
	const name = getName(node) || (ts.isVariableDeclaration(node.parent) && getName(node.parent));
	return wrapClass(fileName, node, name);
}

// match `function foo(props) {...}`
function wrapFunctionDeclaration(node: ts.FunctionDeclaration, fileName: string, addDefaults: string[]) {
	const name = getName(node);
	// remove `export default` modifier into a separate const statement
	const modifiers = node.modifiers;
	const isDefault = removeDefault(modifiers);
	if (isDefault) addDefaults.push(name);
	// convert to `foo = function foo(props)` expression
	const f = ts.createFunctionExpression(undefined, undefined, name, undefined, node.parameters, node.type, node.body);
	return ts.createVariableStatement(
		modifiers,
		ts.createVariableDeclarationList([
			ts.createVariableDeclaration(name, undefined, wrapFunction(fileName, f, name))
		])
	);
}

// match `foo = function(props) {...};`
function wrapFunctionExpression(node: ts.FunctionExpression, fileName: string) {
	const name = getName(node) || (ts.isVariableDeclaration(node.parent) && getName(node.parent));
	return wrapFunction(fileName, node, name);
}

// match `foo = (props) => ...;`
function wrapArrowFunction(node: ts.ArrowFunction, fileName: string) {
	const name = getName(node) || (ts.isVariableDeclaration(node.parent) && getName(node.parent));
	// convert to `foo = function foo(props)` expression
	const body = ts.isBlock(node.body) ? node.body : ts.createBlock([ts.createReturn(node.body)]);
	const f = ts.createFunctionExpression(undefined, undefined, name, undefined, node.parameters, node.type, body);
	return wrapFunction(fileName, f, name);
}

/**
 * Apply defaults and user options
 */
function applyOptions(options: HMRTransformerOptions) {
	proxyModule = PROXY_MODULE;
	proxyWrapper = PROXY_WRAPPER;
	reactBaseClasses = REACT_BASE_CLASSES;
	if (!options) return;

	if (options.proxyModule) {
		proxyModule = options.proxyModule;
	}
	if (options.proxyWrapper) {
		proxyWrapper = options.proxyWrapper;
	}
	if (Array.isArray(options.reactBaseClasses)) {
		reactBaseClasses = options.reactBaseClasses;
	}
}

/**
 * Skip if already explored, or declaration files or a non-JSX files
 */
function skipSourceFile(node: { isDeclarationFile: boolean, fileName: string, __explored__?: boolean }) {
	// nasty?
	if (node.__explored__) return true;
	node.__explored__ = true;

	return node.isDeclarationFile || !node.fileName.endsWith('.tsx');
}

function getName(node: ts.NamedDeclaration) {
	return (node && node.name && node.name.kind === ts.SyntaxKind.Identifier && node.name.text) || undefined;
}

function isReactClass(node: ts.ClassExpression | ts.ClassDeclaration) {
	// assume a class with a base class and a `render` function are React classes (in `.tsx` files)
	return (node.heritageClauses && node.heritageClauses.length > 0
		&& node.members.find(member => getName(member) === 'render'));
}

function isReactFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction) {
	// `function(props)`
	if (Array.isArray(node.parameters) && node.parameters.length === 1) {
		if (getName(node.parameters[0]) === 'props') return true;
	}
	// assume exported functions are React functions (in `.tsx` files)
	if (isExportRec(node)) return true;
	return false;
}

function isExportRec(node: ts.Node) {
	if (isExport(node)) return true;
	if (ts.isVariableDeclarationList(node.parent) && ts.isVariableDeclaration(node.parent.parent)) {
		return isExport(node.parent.parent);
	}
}

function isExport(node: ts.Node) {
    return node.modifiers
        && node.modifiers.find(m => m.kind === ts.SyntaxKind.ExportKeyword);
}

/**
 * `export default function/class` needs to be generated as separated declaration and default export
 **/
function removeDefault(modifiers: ts.ModifiersArray) {
	if (!modifiers) return false;
	const di = modifiers.findIndex(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword);
	if (di >= 0) {
		Array.prototype.splice.call(modifiers, di, 1);
		const ei = modifiers.findIndex(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
		if (ei >= 0) Array.prototype.splice.call(modifiers, ei, 1);
		return true;
	}
	return false;
}

function wrapClass(fileName: string, expression: ts.Expression, name: string) {
	// _hmr_proxy_(0, name, filename, class)
	return ts.createCall(ts.createIdentifier(proxyWrapper), undefined, [
		ts.createStringLiteral(name),
		ts.createStringLiteral(fileName),
		expression
	]);
}

function wrapFunction(fileName: string, expression: ts.Expression, name: string) {
	// _hmr_proxy_(1, name, filename, function)
	return ts.createCall(ts.createIdentifier(proxyWrapper), undefined, [
		ts.createStringLiteral(name),
		ts.createStringLiteral(fileName),
		expression
	]);
}

function hotStatements(makeHot: boolean): ts.Statement[] {
	return makeHot ? reify(`
		const ${proxyWrapper} = require('${proxyModule}');
		if (module.hot) module.hot.accept();
	`) : [];
}

/* REIFICATION: AST from source */

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
