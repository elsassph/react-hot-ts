import * as ts from 'typescript';

const HMR_RUNTIME = 'react-hmr-ts';
let hmrRuntime: string;
let keepArrows: boolean;

/**
 * HMR transformer options:
 * - hmrRuntime: module required by the client HMR proxy
 * - keepArrows: leave arrow functions not re-wired to prototype
 */
type HMRTransformerOptions = {
	hmrRuntime?: string;
	keepArrows?: boolean;
}

/**
 * TypeScript AST transformer
 * Wraps React classes and functional components for HMR
 */
function hmrTransformer(options: HMRTransformerOptions): (context: ts.TransformationContext) => ts.Visitor {
	applyOptions(options);
	if (process.env.NODE_ENV === 'production') {
		console.log('[react-hmr-ts] disabled for production');
		return prodTransformer;
	}
	return devTransformer;
}

/**
 * Production transformer replaces the HMR logic with a no-op
 */
function prodTransformer(context: ts.TransformationContext) {
	const visitor = (node: ts.Node) => {
		if (isSourceFileObject(node)) {
			// replace `react-hmr-ts` imports by a cold version for production
			if (node.imports && node.imports.find(imp => imp.text === 'react-hmr-ts')) {
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
				...visitStatements(node.statements),
				ts.createEmptyStatement(),
				ts.createStatement(ts.createImmediatelyInvokedFunctionExpression([
					...createHotStatements(node.fileName),
					...createRegistrations(node.symbol.exports, node.fileName)
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
	hmrRuntime = HMR_RUNTIME;
	if (!options) return;

	if (typeof options.hmrRuntime === 'string') {
		hmrRuntime = options.hmrRuntime;
	}
	if (options.keepArrows !== undefined) {
		keepArrows = options.keepArrows;
	}
}

function visitStatements(statements: ts.NodeArray<ts.Statement>) {
	if (keepArrows) return statements;

	return Array.prototype.map.call(statements, statement => {
		if (ts.isClassDeclaration(statement) && hasArrowFunctions(statement)) {
			const members = transformArrows(statement.members);
			return ts.updateClassDeclaration(
				statement, statement.decorators, statement.modifiers,
				ts.createIdentifier(statement.name.text), statement.typeParameters,
				statement.heritageClauses, members);
		}
		return statement;
	});
}

// transform arrow-function members into prototype-backed functions
function transformArrows(members: ts.NodeArray<ts.ClassElement>) {
	const extraMembers = [];
	const newMembers = members.map(member => {
		if (ts.isPropertyDeclaration(member) && member.initializer && ts.isArrowFunction(member.initializer)) {
			const fun = member.initializer;
			const body = getBody(fun);
			if (!body) return member;
			const name = getValueName(member);
			const protoName = '_hmr_' + name;
			// create new prototype method with arrow function body
			extraMembers.push(ts.createMethod(
				undefined, [ts.createModifier(ts.SyntaxKind.PrivateKeyword)], undefined,
				protoName, undefined, undefined,
				fun.parameters, fun.type, body));
			// replace arrow function body to invoke new method
			const wrapperBody = ts.createCall(
				createFieldApplyExpression(protoName), undefined,
				[ts.createThis(), ts.createIdentifier('args')]
			);
			const wrapper = ts.createArrowFunction(undefined, undefined,
					[createDotArgs()], fun.type, undefined, wrapperBody)
			return ts.updateProperty(
				member, member.decorators, member.modifiers,
				getValueName(member), undefined, undefined, wrapper);
		}
		return member;
	});
	return [...newMembers, ...extraMembers];
}

function createDotArgs(): any {
	// `...args`
	return ts.createParameter(undefined, undefined, ts.createToken(ts.SyntaxKind.DotDotDotToken), 'args');
}

function createFieldApplyExpression(name: string) {
	// `this.field.apply`
	return ts.createPropertyAccess(ts.createPropertyAccess(ts.createThis(), name), 'apply');
}

function hasArrowFunctions(decl: ts.ClassLikeDeclaration) {
	return decl.members.find(member => member.kind === ts.SyntaxKind.PropertyDeclaration);
}

function shouldSkipSourceFile(node: SourceFileObject) {
	if (node.__explored__) return true;
	node.__explored__ = true;
	return node.isDeclarationFile || !node.fileName.endsWith('.tsx') || node.symbol.exports.size == 0;
}

function createHotStatements(fileName): ts.Statement[] {
	return reify(`
		if (module.hot) module.hot.accept();
		const register = require('${hmrRuntime}').register;
		const fileName = "${fileName}";
		const exports = typeof __webpack_exports__ !== "undefined" ? __webpack_exports__ : module.exports;
	`);
}

function createRegistrations(exports: Map<string, SymbolObject>, fileName: string): ts.Statement[] {
	const statements = [];
	const names: { [name: string]: number } = {};

	exports.forEach((value, key) => {
		// find the declaration name
		let name = getValueName(value.valueDeclaration) || value.name || key;
		if (name === 'default' && value.declarations) {
			const declName = getDeclName(value.declarations[0]);
			if (declName) name = declName;
		}
		if (name === 'default') {
			name = getFileName(fileName) || 'default';
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

function getFileName(fileName: string) {
	const m = /([^.\/\\]+).tsx?$/.exec(fileName);
	return m && m[1] ? m[1] : undefined;
}

function getBody(node: ts.FunctionLike) {
	if (ts.isArrowFunction(node)) {
		return ts.isBlock(node.body) ? node.body : ts.createBlock([ts.createReturn(node.body)]);
	} else if (ts.isFunctionDeclaration(node)) {
		return node.body;
	}
	return undefined;
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
	return ts.isSourceFile(node) && node.hasOwnProperty('symbol');
}

interface SymbolObject extends ts.Node {
	name: string;
	valueDeclaration?: ts.NamedDeclaration;
	exports?: Map<string, SymbolObject>;
	declarations?: ts.Node[];
	members?: ts.Node[];
}

interface TokenObject extends ts.Token<any> {
	text: string;
}

interface SourceFileObject extends ts.SourceFile {
	__explored__?: boolean;
	symbol: SymbolObject;
	imports?: TokenObject[];
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
