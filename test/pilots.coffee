typeVocab = require('fs').readFileSync(require.resolve('@resin/sbvr-types/Type.sbvr'))
test = require('./test')(typeVocab)
{ TableSpace, term, verb, factType, conceptType, referenceScheme, necessity, definition, _or, _and, _nestedOr, _nestedAnd } = require './sbvr-helper'
{ Table, attribute, rule } = TableSpace()

shortTextType = term 'Short Text', 'Type'
integerType = term 'Integer', 'Type'
lengthType = term 'Length', 'Type'

name = term 'name'
yearsOfExperience = term 'years of experience'
pilot = term 'pilot'
veteranPilot = term 'veteran pilot'
plane = term 'plane'

describe 'pilots', ->
	# Term:      name
	test Table name
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# Term:      years of experience
	test Table yearsOfExperience
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType
	# Term:      pilot
	test Table pilot
	# 	Reference Scheme: name
	test attribute referenceScheme name
	# Term:      plane
	test Table plane
	# 	Reference Scheme: name
	test attribute referenceScheme name
	# Fact Type: pilot has name
	test Table factType pilot, verb('has'), name
	# 	Necessity: each pilot has exactly one name
	test attribute necessity 'each', pilot, verb('has'), ['exactly', 'one'], name
	# Fact Type: pilot has years of experience
	test Table factType pilot, verb('has'), yearsOfExperience
	# 	Necessity: each pilot has exactly one years of experience
	test attribute necessity 'each', pilot, verb('has'), ['exactly', 'one'], yearsOfExperience
	# Fact Type: plane has name
	test Table factType plane, verb('has'), name
	# 	Necessity: each plane has exactly one name
	test attribute necessity 'each', plane, verb('has'), ['exactly', 'one'], name
	# Fact type: pilot can fly plane
	test Table factType pilot, verb('can fly'), plane
	# Fact type: pilot is experienced
	test Table factType pilot, verb('is experienced')
	# Term: veteran pilot
	test Table veteranPilot
	# 	Definition: pilot that can fly at least 2 planes
	test attribute definition [pilot, verb('can fly'), ['at least', 2], plane]
	# Rule:       It is necessary that each pilot can fly at least 1 plane
	test rule 'Necessity', 'each', pilot, verb('can fly'), ['at least', 1], plane
	# Rule:       It is necessary that each pilot that is experienced, can fly at least 2 planes
	test rule 'Necessity', 'each', [pilot, verb('is experienced')], verb('can fly'), ['at least', 2], plane
	# Rule:       It is necessary that each pilot that is not experienced, can fly at most 2 planes
	test rule 'Necessity', 'each', [pilot, verb('is experienced', true)], verb('can fly'), ['at most', 2], plane
	# Rule:       It is necessary that each pilot that can fly at most 2 planes, is not experienced
	test rule 'Necessity', 'each', [pilot, verb('can fly'), ['at most', 2], plane], verb('is experienced', true)

	# Rule:       It is necessary that each plane that at least 3 pilots can fly, has a name
	test rule 'Necessity', 'each', [plane, ['at least', 3], pilot, verb('can fly')], verb('has'), 'a', name
	# Rule:       It is necessary that each plane that at least 3 pilots that are experienced can fly, has a name
	test rule 'Necessity', 'each', [plane, ['at least', 3], [pilot, verb('is experienced')], verb('can fly')], verb('has'), 'a', name
	# Rule:       It is necessary that each plane that at least 3 pilots that a name is of can fly, has a name
	test rule 'Necessity', 'each', [plane, ['at least', 3], [pilot, verb('is experienced')], verb('can fly')], verb('has'), 'a', name

	# Rule:       It is necessary that each pilot has a years of experience that is greater than 0
	test rule 'Necessity', 'each', pilot, verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 0]

	# -- OR

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 2 planes or has a years of experience that is greater than 5
	test rule 'Necessity', 'each', [pilot, verb('is experienced')],
		_or(
			[verb('can fly'), ['at least', 2], plane]
			[verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]]
		)
	# Rule:       It is necessary that each pilot that is experienced or can fly at least 2 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_or(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 2], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]
	# Rule:       It is necessary that each pilot that is experienced or can fly at least 3 planes or can fly exactly one plane, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_nestedOr(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
				[verb('can fly'), ['exactly', 'one'], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes or exactly one plane
	test rule 'Necessity', 'each', [pilot, verb('is experienced')], verb('can fly'),
		_or(
			[['at least', 3], plane]
			[['exactly', 'one'], plane]
		)
	# Rule:       It is necessary that each pilot that can fly at least 3 planes or exactly one plane, is experienced
	test rule 'Necessity', 'each',
		[pilot, verb('can fly'),
			_or(
				[['at least', 3], plane]
				[['exactly', 'one'], plane]
			)
		], verb('is experienced')

	# Rule:       It is necessary that each pilot can fly at least one plane or a pilot can fly at least 10 planes
	test rule 'Necessity', _or(
		['each', pilot, verb('can fly'), ['at least', 'one'], plane]
		['a', pilot, verb('can fly'), ['at least', 10], plane]
	)
	# Rule:       It is necessary that each plane that at least 3 pilots can fly or exactly one pilot can fly, has a name
	test rule 'Necessity', 'each', [plane,
		_or(
			[['at least', 3], pilot, verb('can fly')]
			[['exactly', 'one'], pilot, verb('can fly')]
		)], verb('has'), 'a', name

	# -- AND

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 2 planes and has a years of experience that is greater than 5
	test rule 'Necessity', 'each', [pilot, verb('is experienced')],
		_and(
			[verb('can fly'), ['at least', 2], plane]
			[verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]]
		)
	# Rule:       It is necessary that each pilot that is experienced and can fly at least 2 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_and(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 2], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]
	# Rule:       It is necessary that each pilot that is experienced and can fly at least 3 planes and can fly exactly one plane, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_nestedAnd(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
				[verb('can fly'), ['exactly', 'one'], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes and exactly one plane
	test rule 'Necessity', 'each', [pilot, verb('is experienced')], verb('can fly'),
		_and(
			[['at least', 2], plane]
			[['exactly', 'one'], plane]
		)
	# Rule:       It is necessary that each pilot that can fly at least 3 planes and exactly one plane, is experienced
	test rule 'Necessity', 'each',
		[pilot, verb('can fly'),
			_and(
				[['at least', 2], plane]
				[['exactly', 'one'], plane]
			)
		], verb('is experienced')

	# Rule:       It is necessary that each pilot can fly at least one plane and a pilot can fly at least 10 planes
	test rule 'Necessity', _and(
		['each', pilot, verb('can fly'), ['at least', 'one'], plane]
		['a', pilot, verb('can fly'), ['at least', 10], plane]
	)
	# Rule:       It is necessary that each plane that at least 3 pilots can fly and exactly one pilot can fly, has a name
	test rule 'Necessity', 'each', [plane,
		_and(
			[['at least', 3], pilot, verb('can fly')]
			[['exactly', 'one'], pilot, verb('can fly')]
		)], verb('has'), 'a', name

	# -- AND / OR

	# Rule:       It is necessary that each pilot that is experienced and can fly at least 3 planes or can fly exactly one plane, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_and(
				[verb('is experienced')]
				_or(
					[verb('can fly'), ['at least', 3], plane]
					[verb('can fly'), ['exactly', 'one'], plane]
				)
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that can fly at least 3 planes or can fly exactly one plane and is experienced, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_or(
				[verb('can fly'), ['at least', 3], plane]
				_and(
					[verb('can fly'), ['exactly', 'one'], plane]
					[verb('is experienced')]
				)
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# -- Commas

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, and can fly at most 10 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_and(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
				[verb('can fly'), ['at most', 10], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, or can fly exactly one plane, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_or(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
				[verb('can fly'), ['exactly', 'one'], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# # Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, and can fly at most 10 planes or has a name that has a length (Type) that is greater than 10, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_and(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
				_or(
					[verb('can fly'), ['at most', 10], plane]
					[verb('has'), 'a', [name, verb('has'), 'a', [lengthType, verb('is greater than'), 20]]]
				)
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly at least 3 planes, or can fly exactly one plane and has a name that has a length (Type) that is greater than 10, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_or(
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
				_and(
					[verb('can fly'), ['exactly', 'one'], plane]
					[verb('has'), 'a', [name, verb('has'), 'a', [lengthType, verb('is greater than'), 20]]]
				)
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly exactly one plane or can fly at least 5 planes, and can fly at least 3 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_and(
				[verb('is experienced')]
				_or(
					[verb('can fly'), ['exactly', 'one'], plane]
					[verb('can fly'), ['at least', 5], plane]
				)
				[verb('can fly'), ['at least', 3], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly at least one plane and can fly at most 5 planes, or can fly at least 3 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_or(
				[verb('is experienced')]
				_and(
					[verb('can fly'), ['at least', 'one'], plane]
					[verb('can fly'), ['at most', 5], plane]
				)
				[verb('can fly'), ['at least', 3], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly at most 10 planes or has a name that has a length (Type) that is greater than 10, and can fly at least 3 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_and(
				[verb('is experienced')]
				_or(
					[verb('can fly'), ['at most', 10], plane]
					[verb('has'), 'a', [name, verb('has'), 'a', [lengthType, verb('is greater than'), 20]]]
				)
				[verb('can fly'), ['at least', 3], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that is experienced, can fly exactly one plane and has a name that has a length (Type) that is greater than 10, or can fly at least 3 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_or(
				[verb('is experienced')]
				_and(
					[verb('can fly'), ['exactly', 'one'], plane]
					[verb('has'), 'a', [name, verb('has'), 'a', [lengthType, verb('is greater than'), 20]]]
				)
				[verb('can fly'), ['at least', 3], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that can fly at most 10 planes or can fly at least 15 planes, and is experienced and can fly at least 3 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_nestedAnd(
				_or(
					[verb('can fly'), ['at most', 10], plane]
					[verb('can fly'), ['at least', 15], plane]
				)
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]

	# Rule:       It is necessary that each pilot that can fly at least one plane and at most 10 planes, or is experienced or can fly at least 3 planes, has a years of experience that is greater than 5
	test rule 'Necessity', 'each',
		[pilot,
			_nestedOr(
				_and(
					[verb('can fly'), ['exactly', 'one'], plane]
					[verb('can fly'), ['at most', 10], plane]
				)
				[verb('is experienced')]
				[verb('can fly'), ['at least', 3], plane]
			)
		], verb('has'), 'a', [yearsOfExperience, verb('is greater than'), 5]
