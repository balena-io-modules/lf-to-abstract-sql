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
