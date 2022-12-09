const _ = require('lodash');
const sbvrTypes = require('@balena/sbvr-types');

const { expect } = require('chai');
const { toSE, getLineType } = require('./sbvr-helper');

// This allows us to ignore the "whereBody" property at every level of the result
const deleteWhereBodies = function (value) {
	delete value.whereBody;
	if (Array.isArray(value)) {
		value.forEach(deleteWhereBodies);
	}
};

module.exports = function (builtInVocab) {
	if (builtInVocab == null) {
		builtInVocab = false;
	}
	const SBVRParser = require('@balena/sbvr-parser').SBVRParser.createInstance();
	SBVRParser.enableReusingMemoizations(SBVRParser._sideEffectingRules);

	const LF2AbstractSQL = require('../index');
	const LF2AbstractSQLTranslator = LF2AbstractSQL.createTranslator(sbvrTypes);

	if (builtInVocab) {
		SBVRParser.AddBuiltInVocab(builtInVocab);
	}

	let seSoFar = '';
	let previousResult = (function () {
		const lf = SBVRParser.matchAll(seSoFar, 'Process');
		return LF2AbstractSQLTranslator(lf, 'Process');
	})();
	let currentVocab = 'Default';

	const runExpectation = function (describe, input, expectation) {
		let matches;
		let property;
		let ruleSQL;
		if (Array.isArray(input)) {
			const type = getLineType(input);
			input = type + ': ' + toSE(input, currentVocab);
			if (type === 'Vocabulary') {
				currentVocab = input[1];
			}
		} else if (_.isObject(input)) {
			({ matches, property, ruleSQL, se: input } = input);
		}

		it(input, function () {
			try {
				SBVRParser.reset();
				const lf = SBVRParser.matchAll(seSoFar + input, 'Process');
				const result = LF2AbstractSQLTranslator(lf, 'Process');

				seSoFar += input + '\n';
				if (property) {
					if (matches === undefined) {
						expect(result).to.not.have.nested.property(property);
					} else {
						expect(result)
							.to.have.nested.property(property)
							.to.deep.equal(matches);
					}
				} else if (typeof matches === 'function') {
					expect(result).to.satisfy(matches);
				} else if (ruleSQL) {
					const lastRule = result.rules[result.rules.length - 1];
					deleteWhereBodies(lastRule);
					expect(lastRule).to.deep.equal(ruleSQL);
				} else {
					expect(result).to.deep.equal(previousResult);
				}
				previousResult = result;
				if (typeof expectation === 'function') {
					return expectation(result);
				}
			} catch (e) {
				if (expectation != null) {
					return expectation(e);
				} else {
					throw e;
				}
			}
		});
	};

	const ret = runExpectation.bind(null, describe);
	ret.skip = runExpectation.bind(null, describe.skip);
	ret.only = runExpectation.bind(null, describe.only);
	return ret;
};
