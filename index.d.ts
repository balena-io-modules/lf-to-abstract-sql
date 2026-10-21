import type {
	AbstractSqlModel,
	AnyTypeNodes,
	ReferencedFieldNode,
} from '@balena/abstract-sql-compiler' with { 'resolution-mode': 'import' };

import type { LFModel } from '@balena/sbvr-parser';
export type { LFModel } from '@balena/sbvr-parser';

/**
 * The parts of an `@balena/sbvr-types` type that are used when translating rules
 */
export interface SbvrType {
	// Types have other properties (eg `validate`) which are not used here, and many have none of the below
	[otherProperty: string]: unknown;
	nativeNames?: Record<string, AnyTypeNodes>;
	nativeProperties?: Record<
		string,
		Record<string, (from: ReferencedFieldNode) => AnyTypeNodes>
	>;
	nativeFactTypes?: Record<
		string,
		Record<
			string,
			(from: ReferencedFieldNode, to: ReferencedFieldNode) => AnyTypeNodes
		>
	>;
}
/**
 * The types to translate with, keyed by type name, eg the default export of `@balena/sbvr-types`
 */
export type SbvrTypes = { [typeName: string]: SbvrType };

/**
 * The parts of the OMeta API that are useful when extending one of the grammars
 */
export interface OMetaInstance {
	/** Fails the current rule if `condition` is falsy */
	_pred(condition: unknown): true;
	_apply(rule: string): any;
	_applyWithArgs(rule: string, ...args: any[]): any;
}

export interface LF2AbstractSQLPrepInstance extends OMetaInstance {
	match(lfModel: LFModel, rule: 'Process'): LFModel;
}
export interface LF2AbstractSQLPrepGrammar {
	createInstance(): LF2AbstractSQLPrepInstance;
	match(lfModel: LFModel, rule: 'Process'): LFModel;
	_extend<T extends object>(
		extension: T & ThisType<LF2AbstractSQLPrepInstance & T>,
	): LF2AbstractSQLPrepGrammar & T;
}
/**
 * Prepares LF for translation, eg converting cardinality rules into foreign keys
 */
export const LF2AbstractSQLPrep: LF2AbstractSQLPrepGrammar;

export interface LF2AbstractSQLInstance extends OMetaInstance {
	/**
	 * Translates LF that has already been processed by `LF2AbstractSQLPrep`
	 */
	match(lfModel: LFModel, rule: 'Process'): AbstractSqlModel;
	addTypes(types: SbvrTypes): void;
	/**
	 * Resets the state from any previous translation, which must be done before reusing an instance
	 */
	reset(): void;
}
export interface LF2AbstractSQLGrammar {
	createInstance(): LF2AbstractSQLInstance;
	_extend<T extends object>(
		extension: T & ThisType<LF2AbstractSQLInstance & T>,
	): LF2AbstractSQLGrammar & T;
}
export const LF2AbstractSQL: LF2AbstractSQLGrammar;

export interface LF2AbstractSQLTranslator {
	(lfModel: LFModel): AbstractSqlModel;
	/**
	 * @deprecated The `rule` argument is ignored, it is only accepted for backwards compatibility
	 */
	(lfModel: LFModel, rule: 'Process'): AbstractSqlModel;
}

/**
 * Prepares and translates LF into an abstract sql model
 */
export function translate(lfModel: LFModel, types: SbvrTypes): AbstractSqlModel;
/**
 * Creates a reusable translator, which prepares and translates LF into an abstract sql model
 */
export function createTranslator(types: SbvrTypes): LF2AbstractSQLTranslator;
