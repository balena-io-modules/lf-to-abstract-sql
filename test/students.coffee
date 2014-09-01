test = require('./test')()
expect = require('chai').expect
{table, term, verb, factType, conceptType, termForm, referenceScheme, necessity, rule, conceptType, note, definitionEnum, synonym} = require('./sbvr-helper')

has = verb 'has'

person = term 'person'
homoSapiens = term 'homo sapiens'
educationalInstitution = term 'educational institution'
age = term 'age'
student = term 'student'

describe 'students', ->
	# T: person
	test table person
	# 	Synonym: homo sapiens
	test synonym homoSapiens
	# T: educational institution
	test table educationalInstitution
	#	Definition: "UniS" or "UWE"
	test definitionEnum 'UniS', 'UWE'
	# T: age
	test table age
	# F: person is enrolled in educational institution
	test table factType person, verb('is enrolled in'), educationalInstitution
	# Vocabulary: other
	test 'Vocabulary: other'
	# Term: other term
	test table term 'other term'
