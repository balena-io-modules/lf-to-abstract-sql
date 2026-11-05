// Compile time checks of the type definitions against the ways they are used, eg by pinejs
import sbvrTypes from '@balena/sbvr-types';
import type { AbstractSqlModel } from '@balena/abstract-sql-compiler' with {
	'resolution-mode': 'import',
};
import * as LF2AbstractSQL from '..';
import type { LFModel } from '..';

// LF includes booleans for verb negation and numbers for bindings
const lf: LFModel = [
	'Model',
	['Term', 'pilot', 'Default', ['Attributes']],
	[
		'FactType',
		['Term', 'pilot', 'Default'],
		['Verb', 'is experienced', false],
		['Attributes'],
	],
	['RoleBinding', ['Term', 'pilot', 'Default'], 0],
];

// The default export of `@balena/sbvr-types` can be used
const translator = LF2AbstractSQL.createTranslator(sbvrTypes);
export const fromTranslator: AbstractSqlModel = translator(lf);
// The ignored `rule` argument is still accepted for backwards compatibility
export const fromTranslatorWithRule: AbstractSqlModel = translator(
	lf,
	'Process',
);
export const fromTranslate: AbstractSqlModel = LF2AbstractSQL.translate(
	lf,
	sbvrTypes,
);

// Custom types only have to provide what is used during translation
export const customTranslator = LF2AbstractSQL.createTranslator({
	'Some Type': {},
	'Another Type': { nativeNames: { 'Some Name': ['Boolean', true] } },
});

const instance = LF2AbstractSQL.LF2AbstractSQL.createInstance();
instance.addTypes(sbvrTypes);
instance.reset();
export const fromInstance: AbstractSqlModel = instance.match(
	LF2AbstractSQL.LF2AbstractSQLPrep.match(lf, 'Process'),
	'Process',
);

// The OMeta instance is available as `this` when extending a grammar, as pinejs does for `runRule`
const prepHack = LF2AbstractSQL.LF2AbstractSQLPrep._extend({
	CardinalityOptimisation() {
		this._pred(false);
	},
});
export const fromPrepHack: LFModel = prepHack.match(lf, 'Process');

// @ts-expect-error The types are required
LF2AbstractSQL.createTranslator();
// @ts-expect-error `Process` is the only entry point
translator(lf, 'Model');
// @ts-expect-error A translator only accepts LF
translator({});
