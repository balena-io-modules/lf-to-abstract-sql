const test = require('./test')();
const {
	factType,
	necessity,
	TableSpace,
	term,
	verb,
} = require('./sbvr-helper');
const { Table, attribute } = TableSpace();

describe('lfInfo - pilots', function () {
	const name = term('name');
	const pilot = term('pilot');
	const plane = term('plane');

	// Term: name
	test(Table(name));
	// Term: pilot
	test(Table(pilot));
	// Term: plane
	test(Table(plane));
	// Fact type: pilot can fly plane
	test(Table(factType(pilot, verb('can fly'), plane)));
	// Fact Type: plane has name
	test(Table(factType(plane, verb('has'), name)));
	// 	Necessity: each plane has exactly one name
	test(
		attribute(necessity('each', plane, verb('has'), ['exactly', 'one'], name)),
	);
	// Rule: It is necessary that each pilot can fly at least 1 plane
	test({
		se: 'Rule: It is necessary that each pilot can fly at least 1 plane',
		matches: (result) =>
			result.lfInfo.rules[
				'It is necessary that each pilot can fly at least 1 plane'
			].rootAlias === 'pilot.0',
	});
	// Rule: It is necessary that each pilot can fly at least one plane or a pilot can fly at least 10 planes
	test({
		se: 'Rule: It is necessary that each pilot can fly at least one plane or a pilot can fly at least 10 planes',
		matches: (result) =>
			result.lfInfo.rules[
				'It is necessary that each pilot can fly at least one plane or a pilot can fly at least 10 planes'
			].rootAlias === 'pilot.0',
	});
	// Rule: It is necessary that each plane that at least 3 pilots can fly, has a name
	test({
		se: 'Rule: It is necessary that each plane that at least 3 pilots can fly, has a name',
		matches: (result) =>
			result.lfInfo.rules[
				'It is necessary that each plane that at least 3 pilots can fly, has a name'
			].rootAlias === 'plane.0',
	});
});
