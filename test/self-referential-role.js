const test = require('./test')();
const { expect } = require('chai');
const {
	TableSpace,
	term,
	numberedTerms,
	verb,
	factType,
	termForm,
} = require('./sbvr-helper');
const { Table, attribute } = TableSpace();

const gadget = term('gadget');
const label = term('label');
const assignment = term('assignment');
const [, gadget1, gadget2] = numberedTerms(gadget, 3);

describe('self-referential ternary role resolution', function () {
	// Term: gadget
	test(Table(gadget));
	// Term: label
	test(Table(label));
	// Fact type: gadget1 assigns label to gadget2
	// 	Term Form: assignment
	test(Table(factType(gadget1, verb('assigns'), label, verb('to'), gadget2)));
	test(attribute(termForm(assignment)));
	// Fact type: gadget is active
	test(Table(factType(gadget, verb('is active'))));

	test({
		se: '-- the bare relationship for a repeated role must not be clobbered by a later occurrence of the same term',
		matches: (result) => {
			const relationships =
				result.relationships['gadget-assigns-label-to-gadget'];
			// The first role ("gadget", the one that "assigns") owns the bare, unqualified path.
			expect(relationships.gadget.$).to.deep.equal([
				'gadget',
				['gadget', 'id'],
			]);
			// The second role (also "gadget", the "to" object) stays reachable through its own
			// verb-qualified path instead of overwriting the first role's mapping.
			expect(relationships.to.gadget.$).to.deep.equal([
				'to-gadget',
				['gadget', 'id'],
			]);
			return true;
		},
	});

	test({
		se: 'Rule: It is necessary that each gadget1 that assigns a label to a gadget2, is active',
		matches: (result) => {
			const lastRule = result.rules[result.rules.length - 1];
			const linkTableAlias = 'gadget.0-assigns-label.1-to-gadget.2';

			// The bound "gadget1" role is the one the rule actually asserts something about,
			// so it must join through the first role's plain "gadget" field, not through the
			// second role's "to-gadget" field.
			expect(JSON.stringify(lastRule)).to.include(
				JSON.stringify([
					'Equals',
					['ReferencedField', linkTableAlias, 'gadget'],
					['ReferencedField', 'gadget.0', 'id'],
				]),
			);
			expect(JSON.stringify(lastRule)).to.not.include(
				JSON.stringify([
					'Equals',
					['ReferencedField', linkTableAlias, 'to-gadget'],
					['ReferencedField', 'gadget.0', 'id'],
				]),
			);
			return true;
		},
	});
});
