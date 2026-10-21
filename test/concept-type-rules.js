const typeVocab = require('fs').readFileSync(
	require.resolve('@balena/sbvr-types/Type.sbvr'),
);
const test = require('./test')(typeVocab);
const {
	TableSpace,
	term,
	verb,
	factType,
	conceptType,
	necessity,
} = require('./sbvr-helper');
const { Table, attribute } = TableSpace();

const shortTextType = term('Short Text', 'Type');
const name = term('name');
const being = term('being');
const person = term('person');
const pilot = term('pilot');
const plane = term('plane');

describe('rules using fact types of a concept type', function () {
	// Term: name
	test(Table(name));
	// 	Concept Type: Short Text (Type)
	test(attribute(conceptType(shortTextType)));
	// Term: being
	test(Table(being));
	// Term: person
	test(Table(person));
	// 	Concept Type: being
	test(attribute(conceptType(being)));
	// Term: pilot
	test(Table(pilot));
	// 	Concept Type: person
	test(attribute(conceptType(person)));
	// Term: plane
	test(Table(plane));
	// Fact type: being has name
	test(Table(factType(being, verb('has'), name)));
	// 	Necessity: each being has at most one name.
	test(
		attribute(necessity('each', being, verb('has'), ['at most', 'one'], name)),
	);
	// Fact type: person is experienced
	test(Table(factType(person, verb('is experienced'))));
	// Fact type: pilot can fly plane
	test(Table(factType(pilot, verb('can fly'), plane)));

	// The concept type join has to reference the alias of the pilot table (`pilot.0`), not its name
	test({
		se: 'Rule: It is necessary that each pilot that can fly a plane, is experienced.',
		ruleSQL: [
			'Rule',
			[
				'Body',
				[
					'Equals',
					[
						'SelectQuery',
						['Select', [['Count', '*']]],
						['From', ['Alias', ['Table', 'pilot'], 'pilot.0']],
						[
							'From',
							[
								'Alias',
								['Table', 'pilot-can fly-plane'],
								'pilot.0-can fly-plane.1',
							],
						],
						[
							'Where',
							[
								'And',
								[
									'And',
									[
										'Equals',
										['ReferencedField', 'pilot.0-can fly-plane.1', 'pilot'],
										['ReferencedField', 'pilot.0', 'id'],
									],
									[
										'Equals',
										['ReferencedField', 'pilot.0', 'person'],
										['ReferencedField', 'person.0', 'id'],
									],
								],
								[
									'Not',
									[
										'Equals',
										['ReferencedField', 'person.0', 'is experienced'],
										['Boolean', true],
									],
								],
							],
						],
						['From', ['Alias', ['Table', 'person'], 'person.0']],
					],
					['Number', 0],
				],
			],
			[
				'StructuredEnglish',
				'It is necessary that each pilot that can fly a plane, is experienced.',
			],
		],
	});

	// A fact type of a concept type of a concept type has to join every level of the chain
	test({
		se: 'Rule: It is necessary that each pilot that has a name, is experienced.',
		ruleSQL: [
			'Rule',
			[
				'Body',
				[
					'Equals',
					[
						'SelectQuery',
						['Select', [['Count', '*']]],
						['From', ['Alias', ['Table', 'pilot'], 'pilot.0']],
						['From', ['Alias', ['Table', 'person'], 'person.0']],
						[
							'Where',
							[
								'And',
								[
									'And',
									[
										'And',
										[
											'Equals',
											['ReferencedField', 'pilot.0', 'person'],
											['ReferencedField', 'person.0', 'id'],
										],
										[
											'Equals',
											['ReferencedField', 'person.0', 'being'],
											['ReferencedField', 'being.0', 'id'],
										],
									],
									['Exists', ['ReferencedField', 'being.0', 'name']],
								],
								[
									'Not',
									[
										'Equals',
										['ReferencedField', 'person.0', 'is experienced'],
										['Boolean', true],
									],
								],
							],
						],
						['From', ['Alias', ['Table', 'being'], 'being.0']],
					],
					['Number', 0],
				],
			],
			[
				'StructuredEnglish',
				'It is necessary that each pilot that has a name, is experienced.',
			],
		],
	});
});
