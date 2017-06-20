test = require('./test')()
{ TableSpace, term, verb, factType, termForm, necessity, definitionEnum, synonym } = require './sbvr-helper'
{ Table, attribute } = TableSpace()

person = term 'person'
homoSapiens = term 'homo sapiens'
educationalInstitution = term 'educational institution'
age = term 'age'
schoolYearEnrollment = term 'school year enrollment'

describe 'students', ->
	# T: person
	test Table person
	# 	Synonym: homo sapiens
	test attribute synonym homoSapiens
	# T: educational institution
	test Table educationalInstitution
	#	Definition: "UniS" or "UWE"
	test definitionEnum 'UniS', 'UWE'
	# T: age
	test Table age
	# F: person is enrolled in educational institution
	test Table factType person, verb('is enrolled in'), educationalInstitution

	# F: person is enrolled in educational institution for age
	test Table factType person, verb('is enrolled in'), educationalInstitution, verb('for'), age
	# 	Term Form: school year enrollment
	test attribute termForm schoolYearEnrollment
	# -- We use 'for' (the verb used in the initial fact type) as a workaround to allow modifying the initial fact type exactly/at most one cardinality
	# Fact type: school year enrollment has age
	test Table factType schoolYearEnrollment, verb('for'), age
	#     Necessity: each school year enrollment is for exactly one age.
	test attribute necessity 'each', schoolYearEnrollment, verb('for'), ['at most', 'one'], age
	test {
		property: 'tables.school year enrollment.fields[3].required'
		matches: false
		se: '-- should have set the age to not required'
	}

	# Vocabulary: other
	test 'Vocabulary: other'
	# Term: other term
	test Table term 'other term'
