const typeVocab = require('fs').readFileSync(
	require.resolve('@balena/sbvr-types/Type.sbvr'),
);
const test = require('./test')(typeVocab);
const {
	TableSpace,
	term,
	numberedTerms,
	verb,
	factType,
	termForm,
	conceptType,
	referenceScheme,
	synonymousForm,
	necessity,
	definition,
	_or,
	_and,
	_nestedOr,
	_nestedAnd,
	stripLinkTable,
} = require('./sbvr-helper');
const { Table, attribute, rule } = TableSpace();

const shortTextType = term('Short Text', 'Type');
const integerType = term('Integer', 'Type');
const lengthType = term('Length', 'Type');

const name = term('name');
const honorific = term('honorific');
const yearsOfExperience = term('years of experience');
const person = term('person');
const pilot = term('pilot');
const veteranPilot = term('veteran pilot');
const plane = term('plane');
const testTerm = term('test term');
const testTermForm = term('test term form');

const pilots = numberedTerms(pilot, 2);
const planes = numberedTerms(plane, 2);

describe('pilots', function () {
	// Term:      name
	test(Table(name));
	// 	Concept Type: Short Text (Type)
	test(attribute(conceptType(shortTextType)));
	// Term:      honorific
	test(Table(honorific));
	// 	Concept Type: Short Text (Type)
	test(attribute(conceptType(shortTextType)));
	// Term:      years of experience
	test(Table(yearsOfExperience));
	// 	Concept Type: Integer (Type)
	test(attribute(conceptType(integerType)));
	// Term:      test
	test(Table(testTerm));
	// Term:      person
	test(Table(person));
	// Term:      pilot
	test(Table(pilot));
	// 	Reference Scheme: name
	test(attribute(referenceScheme(name)));
	// Term:      plane
	test(Table(plane));
	// 	Reference Scheme: name
	test(attribute(referenceScheme(name)));
	// Fact Type: pilot has name
	test(Table(factType(pilot, verb('has'), name)));
	// 	Necessity: each pilot has exactly one name
	test(
		attribute(necessity('each', pilot, verb('has'), ['exactly', 'one'], name)),
	);
	// 	Fact type: pilot is addressed by honorific
	test(Table(factType(pilot, verb('is addressed by'), honorific)));
	// 	Necessity: each pilot is addressed by exactly one honorific
	test(
		attribute(
			necessity(
				'each',
				pilot,
				verb('is addressed by'),
				['exactly', 'one'],
				honorific,
			),
		),
	);
	// Fact Type: pilot has years of experience
	test(Table(factType(pilot, verb('has'), yearsOfExperience)));
	// 	Necessity: each pilot has exactly one years of experience
	test(
		attribute(
			necessity(
				'each',
				pilot,
				verb('has'),
				['exactly', 'one'],
				yearsOfExperience,
			),
		),
	);
	// Fact Type: plane has name
	test(Table(factType(plane, verb('has'), name)));
	// 	Necessity: each plane has exactly one name
	test(
		attribute(necessity('each', plane, verb('has'), ['exactly', 'one'], name)),
	);
	// Fact type: pilot can fly plane
	test(Table(factType(pilot, verb('can fly'), plane)));
	// 	Synonymous Form: plane can be flown by pilot
	test(attribute(synonymousForm(plane, verb('can be flown by'), pilot)));
	// 	Term Form: test term form
	test(attribute(termForm(testTermForm)));
	// 	Concept Type: test term
	test(attribute(conceptType(testTerm)));
	// Fact type: pilot0 taught pilot1
	test(Table(factType(pilots[0], verb('taught'), pilots[1])));
	// 	Synonymous Form: pilot1 was taught by pilot0
	test(attribute(synonymousForm(pilots[1], verb('was taught by'), pilots[0])));
	// Fact type: pilot is experienced
	test(Table(factType(pilot, verb('is experienced'))));
	// Term: veteran pilot
	test(Table(veteranPilot));
	// 	Definition: pilot that can fly at least 2 planes
	test(attribute(definition([pilot, verb('can fly'), ['at least', 2], plane])));
	// Rule:       It is necessary that each pilot can fly at least 1 plane
	test({
		se: 'Rule: It is necessary that each pilot can fly at least 1 plane',
		ruleSQL: [
			'Rule',
			[
				'Body',
				[
					'Not',
					[
						'Exists',
						[
							'SelectQuery',
							['Select', []],
							['From', ['Alias', ['Table', 'pilot'], 'pilot.0']],
							[
								'Where',
								[
									'Not',
									[
										'Exists',
										[
											'SelectQuery',
											['Select', []],
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
													'Equals',
													[
														'ReferencedField',
														'pilot.0-can fly-plane.1',
														'pilot',
													],
													['ReferencedField', 'pilot.0', 'id'],
												],
											],
										],
									],
								],
							],
						],
					],
				],
			],
			[
				'StructuredEnglish',
				'It is necessary that each pilot can fly at least 1 plane',
			],
		],
	});
	// Rule:       It is necessary that each pilot that is experienced, can fly at least 2 planes
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[pilot, verb('is experienced')],
				verb('can fly'),
				['at least', 2],
				plane,
			),
		),
	);
	// Rule:       It is necessary that each pilot that is not experienced, can fly at most 2 planes
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[pilot, verb('is experienced', true)],
				verb('can fly'),
				['at most', 2],
				plane,
			),
		),
	);
	// Rule:       It is necessary that each pilot that can fly at most 2 planes, is not experienced
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[pilot, verb('can fly'), ['at most', 2], plane],
				verb('is experienced', true),
			),
		),
	);

	// Rule:       It is necessary that each plane that at least 3 pilots can fly, has a name
	test(
		stripLinkTable(
			'pilot.1',
			rule(
				'Necessity',
				'each',
				[plane, ['at least', 3], pilot, verb('can fly')],
				verb('has'),
				'a',
				name,
			),
		),
	);
	// Rule:       It is necessary that each plane that at least 3 pilots that are experienced can fly, has a name
	test(
		rule(
			'Necessity',
			'each',
			[
				plane,
				['at least', 3],
				[pilot, verb('is experienced')],
				verb('can fly'),
			],
			verb('has'),
			'a',
			name,
		),
	);
	// Rule:       It is necessary that each plane that at least 3 pilots that a name is of can fly, has a name
	test(
		rule(
			'Necessity',
			'each',
			[
				plane,
				['at least', 3],
				[pilot, verb('is experienced')],
				verb('can fly'),
			],
			verb('has'),
			'a',
			name,
		),
	);

	// Rule:       It is necessary that each pilot has a years of experience that is greater than 0
	test(
		rule('Necessity', 'each', pilot, verb('has'), 'a', [
			yearsOfExperience,
			verb('is greater than'),
			0,
		]),
	);
	// Rule:       It is necessary that each pilot has a years of experience that is not greater than 0
	test(
		rule('Necessity', 'each', pilot, verb('has'), 'a', [
			yearsOfExperience,
			verb('is greater than', true),
			0,
		]),
	);

	// -- OR

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 2 planes or has a years of experience that is greater than 5
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[pilot, verb('is experienced')],
				_or(
					[verb('can fly'), ['at least', 2], plane],
					[verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]],
				),
			),
		),
	);
	// Rule:       It is necessary that each pilot that is experienced or can fly at least 2 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_or(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 2], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);
	// Rule:       It is necessary that each pilot that is experienced or can fly at least 3 planes or can fly exactly one plane, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_nestedOr(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
						[verb('can fly'), ['exactly', 'one'], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes or exactly one plane
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[pilot, verb('is experienced')],
				verb('can fly'),
				_or([['at least', 3], plane], [['exactly', 'one'], plane]),
			),
		),
	);
	// Rule:       It is necessary that each pilot that can fly at least 3 planes or exactly one plane, is experienced
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					verb('can fly'),
					_or([['at least', 3], plane], [['exactly', 'one'], plane]),
				],
				verb('is experienced'),
			),
		),
	);

	// Rule:       It is necessary that each pilot can fly at least one plane or a pilot can fly at least 10 planes
	test(
		stripLinkTable(
			['plane.1', 'plane.3'],
			rule(
				'Necessity',
				_or(
					['each', pilot, verb('can fly'), ['at least', 'one'], plane],
					['a', pilot, verb('can fly'), ['at least', 10], plane],
				),
			),
		),
	);

	// Rule:       It is necessary that each plane that at least 3 pilots can fly or exactly one pilot can fly, has a name
	test(
		stripLinkTable(
			['pilot.1', 'pilot.2'],
			rule(
				'Necessity',
				'each',
				[
					plane,
					_or(
						[['at least', 3], pilot, verb('can fly')],
						[['exactly', 'one'], pilot, verb('can fly')],
					),
				],
				verb('has'),
				'a',
				name,
			),
		),
	);

	// -- AND

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 2 planes and has a years of experience that is greater than 5
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[pilot, verb('is experienced')],
				_and(
					[verb('can fly'), ['at least', 2], plane],
					[verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]],
				),
			),
		),
	);
	// Rule:       It is necessary that each pilot that is experienced and can fly at least 2 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			'plane.1',
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_and(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 2], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);
	// Rule:       It is necessary that each pilot that is experienced and can fly at least 3 planes and can fly exactly one plane, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_nestedAnd(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
						[verb('can fly'), ['exactly', 'one'], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes and exactly one plane
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[pilot, verb('is experienced')],
				verb('can fly'),
				_and([['at least', 2], plane], [['exactly', 'one'], plane]),
			),
		),
	);
	// Rule:       It is necessary that each pilot that can fly at least 3 planes and exactly one plane, is experienced
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					verb('can fly'),
					_and([['at least', 2], plane], [['exactly', 'one'], plane]),
				],
				verb('is experienced'),
			),
		),
	);

	// Rule:       It is necessary that each pilot can fly at least one plane and a pilot can fly at least 10 planes
	test(
		stripLinkTable(
			['plane.1', 'plane.3'],
			rule(
				'Necessity',
				_and(
					['each', pilot, verb('can fly'), ['at least', 'one'], plane],
					['a', pilot, verb('can fly'), ['at least', 10], plane],
				),
			),
		),
	);

	// Rule:       It is necessary that each plane that at least 3 pilots can fly and exactly one pilot can fly, has a name
	test(
		stripLinkTable(
			['pilot.1', 'pilot.2'],
			rule(
				'Necessity',
				'each',
				[
					plane,
					_and(
						[['at least', 3], pilot, verb('can fly')],
						[['exactly', 'one'], pilot, verb('can fly')],
					),
				],
				verb('has'),
				'a',
				name,
			),
		),
	);

	// -- AND / OR

	// Rule:       It is necessary that each pilot that is experienced and can fly at least 3 planes or can fly exactly one plane, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_and(
						[verb('is experienced')],
						_or(
							[verb('can fly'), ['at least', 3], plane],
							[verb('can fly'), ['exactly', 'one'], plane],
						),
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that can fly at least 3 planes or can fly exactly one plane and is experienced, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_or(
						[verb('can fly'), ['at least', 3], plane],
						_and(
							[verb('can fly'), ['exactly', 'one'], plane],
							[verb('is experienced')],
						),
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// -- Commas

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, and can fly at most 10 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_and(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
						[verb('can fly'), ['at most', 10], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, or can fly exactly one plane, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_or(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
						[verb('can fly'), ['exactly', 'one'], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// # Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, and can fly at most 10 planes or has a name that has a length (Type) that is greater than 10, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_and(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
						_or(
							[verb('can fly'), ['at most', 10], plane],
							[
								verb('has'),
								'a',
								[
									name,
									verb('has'),
									'a',
									[lengthType, verb('is greater than'), 20],
								],
							],
						),
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, or can fly exactly one plane and has a name that has a length (Type) that is greater than 10, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_or(
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
						_and(
							[verb('can fly'), ['exactly', 'one'], plane],
							[
								verb('has'),
								'a',
								[
									name,
									verb('has'),
									'a',
									[lengthType, verb('is greater than'), 20],
								],
							],
						),
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly exactly one plane or can fly at least 5 planes, and can fly at least 3 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2', 'plane.3'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_and(
						[verb('is experienced')],
						_or(
							[verb('can fly'), ['exactly', 'one'], plane],
							[verb('can fly'), ['at least', 5], plane],
						),
						[verb('can fly'), ['at least', 3], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly at least one plane and can fly at most 5 planes, or can fly at least 3 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2', 'plane.3'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_or(
						[verb('is experienced')],
						_and(
							[verb('can fly'), ['at least', 'one'], plane],
							[verb('can fly'), ['at most', 5], plane],
						),
						[verb('can fly'), ['at least', 3], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly at most 10 planes or has a name that has a length (Type) that is greater than 10, and can fly at least 3 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.4'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_and(
						[verb('is experienced')],
						_or(
							[verb('can fly'), ['at most', 10], plane],
							[
								verb('has'),
								'a',
								[
									name,
									verb('has'),
									'a',
									[lengthType, verb('is greater than'), 20],
								],
							],
						),
						[verb('can fly'), ['at least', 3], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that is experienced, can fly exactly one plane and has a name that has a length (Type) that is greater than 10, or can fly at least 3 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.4'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_or(
						[verb('is experienced')],
						_and(
							[verb('can fly'), ['exactly', 'one'], plane],
							[
								verb('has'),
								'a',
								[
									name,
									verb('has'),
									'a',
									[lengthType, verb('is greater than'), 20],
								],
							],
						),
						[verb('can fly'), ['at least', 3], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that can fly at most 10 planes or can fly at least 15 planes, and is experienced and can fly at least 3 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2', 'plane.3'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_nestedAnd(
						_or(
							[verb('can fly'), ['at most', 10], plane],
							[verb('can fly'), ['at least', 15], plane],
						),
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);

	// Rule:       It is necessary that each pilot that can fly at least one plane and at most 10 planes, or is experienced or can fly at least 3 planes, has a years of experience that is greater than 5
	test(
		stripLinkTable(
			['plane.1', 'plane.2', 'plane.3'],
			rule(
				'Necessity',
				'each',
				[
					pilot,
					_nestedOr(
						_and(
							[verb('can fly'), ['exactly', 'one'], plane],
							[verb('can fly'), ['at most', 10], plane],
						),
						[verb('is experienced')],
						[verb('can fly'), ['at least', 3], plane],
					),
				],
				verb('has'),
				'a',
				[yearsOfExperience, verb('is greater than'), 5],
			),
		),
	);
});
