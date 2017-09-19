_ = require 'lodash'
LFOptimiser = require('@resin/sbvr-parser/lf-optimiser').LFOptimiser

# Inherit from the sbvr-parser's sbvr-helper module.
module.exports = exports = require '@resin/sbvr-parser/test/sbvr-helper.coffee'
{ toSE, rule, getLineType } = exports

nest = (lf, sequence, allMatches = false) ->
	if sequence.length is 0
		return lf
	if lf[0] is sequence[0]
		return nest(lf, sequence[1...], allMatches)
	results = []
	for part in lf when part? and part[0] is sequence[0]
		result = nest(part, sequence[1...], allMatches)
		if result
			if !allMatches
				return result
			results.push(result)
	if results.length > 0
		return results
	return false

generateName = (namePart) ->
	namePart

generateFieldName = (factType) ->
	if factType[1][1] is 'has'
		# If it's a has we just use the term
		return factType[2][1]
	return factType[1][1] + '-' + factType[2][1]

createdAtField =
	dataType: 'Date Time'
	fieldName: 'created at'
	required: true
	index: null
	references: null
	defaultValue: 'CURRENT_TIMESTAMP'

exports.TableSpace = ->
	tables = {}
	synonyms = {}

	resolveSynonym = (name) ->
		return synonyms[name] ? name
	getTable = (name) ->
		return tables[resolveSynonym(generateName(name))]

	isPrimitive = (term) ->
		if term[2] is 'Type'
			return term[1]
		table = getTable(term[1])
		return table.table.primitive
	parseFactType = (factType, bindings) ->
		primitiveFactType = true
		tableName = []
		tableAlias = []
		for part in factType
			switch part[0]
				when 'Term'
					termName = part[1]
					binding = _.find(bindings, { termName })
					tableName.push(generateName(termName))
					tableAlias.push(binding?.alias)
					if !isPrimitive(part)
						primitiveFactType = false
				when 'Verb'
					verb = part
					verbName = part[1]
					tableName.push(generateName(verbName))
					tableAlias.push(verbName)
		return {
			tableName: tableName.map(resolveSynonym).join('-')
			tableAlias: tableAlias.join('-')
			verb
			primitiveFactType
			booleanAttribute: factType.length is 2
			binding
		}

	currentTable = null

	return {
		attribute: (args...) ->
			currentTable.attribute(args...)
		Table: class Table
			constructor: (lf, currentVocab = 'Default') ->
				if !(this instanceof Table)
					return new Table(lf, currentVocab)
				currentTable = this

				idField = 'id'
				fields = [createdAtField]
				indexes = []
				switch lf[0]
					when 'Term'
						modelName = lf[1]
						tableName = generateName(lf[1])
						referenceScheme = idField
					when 'FactType'
						modelName = _(lf).without('FactType').reject(0: 'Attributes').map(1).join(' ')
						tableName = []
						resourceName = []
						uniqueIndex =
							type: 'UNIQUE'
							fields: []
						factType = lf[1...-1]
						if factType.length is 2
							booleanAttribute = true
						for factTypePart, i in factType
							name = generateName(factTypePart[1])
							tableName.push(name)
							referenceTableName = resolveSynonym(name)
							resourceName.push(referenceTableName)
							if getTable(referenceTableName)?
								# Update to the table's true name, for instance in the case of term form.
								referenceTableName = getTable(referenceTableName).tableName
							if factTypePart[0] is 'Term'
								fieldName =
									if i is 0
										generateName(factTypePart[1])
									else
										generateFieldName(factType[i - 2..i])
								uniqueIndex.fields.push(fieldName)
								primitive = isPrimitive(factTypePart)
								if primitive
									dataType = primitive
									references = null
								else
									dataType = 'ForeignKey'
									references =
										fieldName: 'id'
										tableName: referenceTableName
								fields.push(
									dataType: dataType
									fieldName: fieldName
									required: true
									index: null
									references: references
									defaultValue: null
								)
						indexes.push(uniqueIndex)
						tableName = tableName.join('-')
						resourceName = resourceName.join('-')
				fields.push(
					dataType: 'Serial'
					fieldName: idField
					required: true
					index: 'PRIMARY KEY'
					references: null
					defaultValue: null
				)
				tableDefinition = {
					name: tableName
					resourceName: resourceName ? tableName
					modelName
					primitive: false
					idField
					fields
					indexes
				}
				if referenceScheme?
					tableDefinition.referenceScheme = referenceScheme

				# If we're a boolean attribute then we override the definition.
				if booleanAttribute
					tableDefinition = 'BooleanAttribute'
					@matches = undefined
				else
					@matches = _.cloneDeep(tableDefinition)

				@se = getLineType(lf) + ': ' + toSE(lf, currentVocab)
				@property = 'tables.' + tableDefinition.resourceName
				@table = tableDefinition
				@tableName = tableName

				tables[tableName] = this

			attribute: (lf, currentVocab = 'Default') ->
				if _.isArray(lf)
					se = toSE(lf, currentVocab)
				else if _.isObject(lf)
					{ lf, se } = lf
				@se = getLineType(lf) + ': ' + se
				switch lf[0]
					when 'ConceptType'
						term = lf[1]
						primitive = isPrimitive(term)
						if primitive
							typeName = term[1]
							primitiveField =
								dataType: primitive
								fieldName: typeName
								required: true
								index: null
								references: null
								defaultValue: null
							_.assign @table,
								idField: null
								primitive: primitive
								referenceScheme: typeName
								fields: [
									createdAtField
									primitiveField
								]
							@matches = undefined
						else
							typeName = term[1]
							@table.fields.push
								dataType: 'ConceptType'
								fieldName: typeName
								required: true
								index: null
								references:
									fieldName: 'id'
									tableName: generateName(typeName)
								defaultValue: null
							@property = 'tables.' + @table.resourceName
							@matches = _.cloneDeep(@table)
					when 'ReferenceScheme'
						term = lf[1]
						@table.referenceScheme = term[1]
						@property = 'tables.' + @table.resourceName
						@matches = _.cloneDeep(@table)
					when 'Necessity'
						lf = nest(lf, ['Rule', 'NecessityFormulation', 'UniversalQuantification'])
						quant = nest(lf, ['ExactQuantification'])
						if quant
							card = nest(quant, ['Cardinality', 'Number'])
						else
							quant = nest(lf, ['AtMostNQuantification'])
							card = nest(quant, ['MaximumCardinality', 'Number'])
						if card and card[1] is 1
							bindings = nest(quant, ['AtomicFormulation', 'RoleBinding'], true)[0]
							if _.some(bindings, (binding) -> getTable(binding[1][1]).table.primitive)
								@table = 'Attribute'
							else
								@table = 'ForeignKey'
							@matches = undefined
					when 'Definition'
						# Nulling the property just checks that there are no changes to the previous test result.
						@property = null
					when 'SynonymousForm'
						tableName = parseFactType(lf[1]).tableName
						tables[tableName] = this
					when 'Synonym'
						synonym = generateName(lf[1][1])
						synonyms[synonym] = @tableName
						@property = 'synonyms'
						@matches = _.clone(synonyms)
					when 'TermForm'
						termFormSynonym = generateName(lf[1][1])
						synonyms[termFormSynonym] = @tableName
						@property = 'synonyms'
						@matches = _.clone(synonyms)
					else
						console.log 'Unknown attribute', require('util').inspect(lf, depth: null)
				return this

		rule: do ->
			attributeBindings = {}

			queryConcat = (query, extra) ->
				whereClause = nest(query, ['Where'])
				extraWhereClause = nest(extra, ['Where'])
				if extra is extraWhereClause
					extra = [extra]
				if whereClause and extraWhereClause
					whereClause[1] = [
						'And'
						whereClause[1]
						extraWhereClause[1]
					]
					extra = _.reject(extra, 0: 'Where')
				return query.concat(extra)

			checkType = (type, allMatches, fn) ->
				if !fn?
					fn = allMatches
					allMatches = null
				(lf) ->
					subLF = nest(lf, [type], allMatches)
					if !subLF
						console.error(lf)
						throw new Error('No entry for: ' + type)
					fn(subLF)

			junction = (fn) ->
				junctionFn = (lf) ->
					if lf[0] is 'Disjunction'
						type = 'Or'
					else if lf[0] is 'Conjunction'
						type = 'And'
					else
						return fn(lf)

					results =
						for part in lf[1...]
							result = junctionFn(part)
							whereClause = nest(result, ['Where'])
							if whereClause
								whereClause[1]
							else
								result
					return ['Where', [type, results...]]
				return junctionFn

			variable = checkType 'Variable', (lf) ->
				term = nest(lf, ['Term'])
				termName = term[1]
				varNum = nest(lf, ['Number'])[1]
				query = [
					'SelectQuery'
					['Select', []]
					[	'From'
						[	generateName(termName)
							termName + '.' + varNum
						]
					]
				]
				extra = []
				if lf.length is 4
					extra = quant(lf[3])
				if isPrimitive(term)
					return extra
				return queryConcat(query, extra)

			roleBindings = checkType 'RoleBinding', true, (lf) ->
				lf.map (binding) ->
					term = nest(binding, ['Term'])
					termName = term[1]
					alias = termName + '.' + binding[2]
					return {
						termName: termName
						alias: alias
						embeddedData: attributeBindings[alias] ? term[3]
					}

			atomicFormulation = junction checkType 'AtomicFormulation', (lf) ->
				factType = nest(lf, ['FactType'])
				factType = factType[1...]
				bindings = roleBindings(lf, ['RoleBinding'], true)

				{ tableName, tableAlias, verb, primitiveFactType, booleanAttribute, binding } = parseFactType(factType, bindings)

				if booleanAttribute
					return [
						'Where'
						[	'Equals'
							['ReferencedField', bindings[0].alias, verb[1]]
							['Boolean', !verb[2]]
						]
					]

				if primitiveFactType
					comparison = switch factType[1][1]
						when 'is greater than'
							# Greater than gets reversed into a less than
							[
								'LessThan'
								bindings[1].embeddedData
								bindings[0].embeddedData
							]
						when 'is less than'
							[
								'LessThan'
								bindings[0].embeddedData
								bindings[1].embeddedData
							]
						when 'has'
							attributeBindings[bindings[1].alias] = [
								'CharacterLength'
								bindings[0].embeddedData
							]
							attributeBindings[bindings[1].alias]
						else
							throw new Error('Unknown primitive fact type: ' + factType[1][1])
					if factType[1][2]
						return ['Not', comparison]
					return comparison

				if getTable(tableName).table is 'Attribute'
					attributeBindings[binding.alias] = ['ReferencedField', bindings[0].alias, generateFieldName(factType)]
					return attributeBindings[binding.alias]

				return [
					[	'From'
						[	tableName
							tableAlias
						]
					]
					[	'Where'
						['And'].concat(
							bindings.map (binding, i) ->
								[	'Equals'
									['ReferencedField', tableAlias, factType[i * 2][1]]
									['ReferencedField', binding.alias, 'id']
								]
						)
					]
				]

			compareQuery = (lf) ->
				query = variable(lf)
				query = queryConcat(query, atomicFormulation(lf))
				select = nest(query, ['Select'])
				if select[1].length is 0
					select[1].push(['Count', '*'])
				return query

			atLeastN = (lf, minCard) ->
				if minCard is 0
					return ['Boolean', true]
				return ['GreaterThanOrEqual', compareQuery(lf) , ['Number', minCard]]

			quant = junction (lf) ->
				if lf[0] is 'AtomicFormulation'
					return atomicFormulation(lf)
				whereBody = do ->
					switch lf[0]
						when 'AtMostNQuantification'
							maxCard = nest(lf, ['MaximumCardinality', 'Number'])[1]
							minCard = maxCard + 1
							return ['Not', atLeastN(lf, minCard)]
						when 'AtLeastNQuantification'
							minCard = nest(lf, ['MinimumCardinality', 'Number'])[1]
							return atLeastN(lf, minCard)
						when 'ExactQuantification'
							card = nest(lf, ['Cardinality', 'Number'])
							return ['Equals', compareQuery(lf), card]
						when 'ExistentialQuantification'
							extra = quant(lf[2])
							query = variable(lf)
							if nest(extra, ['Where'])
								query = queryConcat(query, extra)
								return ['Exists', query]
							extra = ['Exists', extra]
							if query.length is 0
								return extra
							if query[0] is 'Where'
								query = query[1]
							return [
								'And'
								query
								extra
							]
						when 'UniversalQuantification'
							query = variable(lf)
							extra = quant(lf[2])

							whereClause = nest(extra, ['Where'])
							if whereClause[1][0] is 'Not'
								whereClause[1] = whereClause[1][1]
							else
								whereClause[1] = ['Not', whereClause[1]]

							query = queryConcat(query, extra)
							return ['Not', ['Exists', query]]
						else
							throw new Error('Unknown quant: ' + lf[0])
				return ['Where', whereBody]

			formulation = (lf) ->
				switch lf[0]
					when 'NecessityFormulation'
						['Body', quant(lf[1])[1]]
					else
						throw new Error('Unknown formulation: ' + lf[0])

			return (args...) ->
				attributeBindings = {}
				lf = rule(args...)
				lf = LFOptimiser.match(lf, 'Process')
				lf[1] = formulation(lf[1])
				return {
					se: getLineType(lf) + ': ' + toSE(lf)
					ruleSQL: lf
				}
	}
