typeVocab = require('fs').readFileSync(__dirname + '/Type.sbvr')
test = require('./test')(typeVocab)
{TableSpace, term, verb, factType, conceptType, referenceScheme, necessity, rule, definition, _or, _and, _nestedOr, _nestedAnd} = require('./sbvr-helper')
{Table, attribute} = TableSpace()

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
