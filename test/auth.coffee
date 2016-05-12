typeVocab = require('fs').readFileSync(require.resolve('@resin/sbvr-types/Type.sbvr'))
test = require('./test')(typeVocab)
_ = require 'lodash'
{ TableSpace, vocabulary, term, verb, factType, conceptType, referenceScheme, vocabNecessity, vocabRule } = require('./sbvr-helper')
{ Table, attribute, rule } = TableSpace()
Table = _.partial(Table, _, 'Auth')
attribute = _.partial(attribute, _, 'Auth')
rule = _.partial(vocabRule, 'Auth')
necessity = _.partial(vocabNecessity, 'Auth')

shortTextType = term 'Short Text', 'Type'
hashedType = term 'Hashed', 'Type'

key = term 'key', 'Auth'
username = term 'username', 'Auth'
name = term 'name', 'Auth'
password = term 'password', 'Auth'
permission = term 'permission', 'Auth'
role = term 'role', 'Auth'
user = term 'user', 'Auth'
actor = term 'actor', 'Auth'
apiKey = term 'api key', 'Auth'

has = verb('has')

describe 'Auth', ->
	# Vocabulary: Auth
	test vocabulary 'Auth'
	# Term:       username
	test Table username
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# Term:       password
	test Table password
	# 	Concept Type: Hashed (Type)
	test attribute conceptType hashedType
	# Term:       name
	test Table name
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# Term:       key
	test Table key
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Term:       permission
	test Table permission
	# 	Reference Scheme: name
	test attribute referenceScheme name
	# Fact type:  permission has name
	test Table factType permission, has, name
	# 	Necessity: Each permission has exactly one name.
	test attribute necessity 'each', permission, has, ['exactly', 'one'], name
	# 	Necessity: Each name is of exactly one permission.
	test attribute necessity 'each', name, verb('is of'), ['exactly', 'one'], permission

	# Term:       role
	test Table role
	# 	Reference Scheme: name
	test attribute referenceScheme name
	# Fact type:  role has name
	test Table factType role, has, name
	# 	Necessity: Each role has exactly one name.
	test attribute necessity 'each', role, has, ['exactly', 'one'], name
	# 	Necessity: Each name is of exactly one role.
	test attribute necessity 'each', name, verb('is of'), ['exactly', 'one'], role
	# Fact type:  role has permission
	test Table factType role, has, permission

	# Term:       actor
	test Table actor

	# Term:       user
	test Table user
	# 	Reference Scheme: username
	test attribute referenceScheme username
	# 	Concept Type: actor
	test attribute conceptType actor
	# Fact type:  user has username
	test Table factType user, has, username
	# 	Necessity: Each user has exactly one username.
	test attribute necessity 'each', user, has, ['exactly', 'one'], username
	# 	Necessity: Each username is of exactly one user.
	test attribute necessity 'each', username, verb('is of'), ['exactly', 'one'], user
	# Fact type:  user has password
	test Table factType user, has, password
	# 	Necessity: Each user has exactly one password.
	test attribute necessity 'each', user, has, ['exactly', 'one'], password
	# Fact type:  user has role
	test Table factType user, has, role
	# 	Note: A 'user' will inherit all the 'permissions' that the 'role' has.
	# Fact type:  user has permission
	test Table factType user, has, permission

	# Term:       api key
	test Table apiKey
		# Reference Scheme: key
	test attribute referenceScheme key
	# Fact type:  api key has key
	test Table factType apiKey, has, key
	# 	Necessity: each api key has exactly one key
	test attribute necessity 'each', apiKey, has, ['exactly', 'one'], key
	# 	Necessity: each key is of exactly one api key
	test attribute necessity 'each', key, verb('is of'), ['exactly', 'one'], apiKey
	# Fact type:  api key has role
	test Table factType apiKey, has, role
		# Note: An 'api key' will inherit all the 'permissions' that the 'role' has.
	# Fact type:  api key has permission
	test Table factType apiKey, has, permission
	# Fact type:  api key is of actor
	test Table factType apiKey, verb('is of'), actor
	# 	Necessity: each api key is of exactly one actor
	test attribute necessity 'each', apiKey, verb('is of'), ['exactly', 'one'], actor
