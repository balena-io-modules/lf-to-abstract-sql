const test = require('./test')();
const {
	TableSpace,
	term,
	verb,
	factType,
	necessity,
	referenceType,
} = require('./sbvr-helper');
const { Table, attribute } = TableSpace();
let testTerm = term('term');
let termHistory = term('term history');
let termHistoryStrict = term('term history strict');
let termReferenceDefault = term('term reference default');

describe('informative term reference', function () {
	// Term: term
	// Term: term history
	// Fact Type: term history references term
	// 		Necessity: each term history references exactly one term
	//		ReferenceType: informative

	test(Table(testTerm));
	test(Table(termHistory));
	test(Table(factType(termHistory, verb('references'), testTerm)));
	test(
		attribute(
			necessity(
				'each',
				termHistory,
				verb('references'),
				['at most', 1],
				testTerm,
			),
		),
	);
	test(attribute(referenceType('informative')));

	// Term: term
	// Term: term history strict
	// Fact Type: term history strict references term
	// 		Necessity: each term history strict references exactly one term
	//		ReferenceType: strict

	test(Table(termHistoryStrict));
	test(Table(factType(termHistoryStrict, verb('references'), testTerm)));
	test(
		attribute(
			necessity(
				'each',
				termHistoryStrict,
				verb('references'),
				['at most', 'one'],
				testTerm,
			),
		),
	);
	test(attribute(referenceType('strict')));

	// Term: term
	// Term: term reference default
	// Fact Type: term reference default references term
	// 		Necessity: each term reference default references exactly one term

	// implicit strict reference type

	test(Table(termReferenceDefault));
	test(Table(factType(termReferenceDefault, verb('references'), testTerm)));
	test(
		attribute(
			necessity(
				'each',
				termReferenceDefault,
				verb('references'),
				['at most', 'one'],
				testTerm,
			),
		),
	);
});
