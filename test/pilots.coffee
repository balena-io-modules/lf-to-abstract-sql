typeVocab = require('fs').readFileSync(__dirname + '/Type.sbvr')
test = require('./test')(typeVocab)
{TableSpace, term, verb, factType, conceptType, referenceScheme, necessity, rule, definition, _or, _and, _nestedOr, _nestedAnd} = require('./sbvr-helper')
Table = TableSpace()

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
	test nameTable = new Table name
	# 	Concept Type: Short Text (Type)
	test nameTable.attribute conceptType shortTextType
	# Term:      years of experience
	test yearsOfExperienceTable = new Table yearsOfExperience
	# 	Concept Type: Integer (Type)
	test yearsOfExperienceTable.attribute conceptType integerType
	# Term:      pilot
	test pilotTable = new Table pilot
	# 	Reference Scheme: name
	test pilotTable.attribute referenceScheme name
	# Term:      plane
	test planeTable = new Table plane
	# 	Reference Scheme: name
	test planeTable.attribute referenceScheme name
	# Fact Type: pilot has name
	test pilotHasNameTable = new Table factType pilot, verb('has'), name
