test = require('./test')()
expect = require('chai').expect
{TableSpace, term, verb, factType, conceptType, termForm, referenceScheme, necessity, rule, conceptType, note, definitionEnum, synonym} = require('./sbvr-helper')
Table = TableSpace()
has = verb 'has'

person = term 'person'
homoSapiens = term 'homo sapiens'
educationalInstitution = term 'educational institution'
age = term 'age'
student = term 'student'

describe 'students', ->
	# T: person
	test new Table person
	# 	Synonym: homo sapiens
	test synonym homoSapiens
	# T: educational institution
	test new Table educationalInstitution
	#	Definition: "UniS" or "UWE"
	test definitionEnum 'UniS', 'UWE'
	# T: age
	test new Table age
	# F: person is enrolled in educational institution
	test new Table factType person, verb('is enrolled in'), educationalInstitution
	# Vocabulary: other
	test 'Vocabulary: other'
	# Term: other term
	test new Table term 'other term'
