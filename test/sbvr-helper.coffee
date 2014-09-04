_ = require 'lodash'
LFOptimiser = require('sbvr-parser/lf-optimiser').LFOptimiser

# Inherit from the sbvr-parser's sbvr-helper module.
module.exports = exports = require('sbvr-parser/test/sbvr-helper.coffee')
{toSE, rule, getLineType} = exports

nest = (lf, sequence, allMatches = false) ->
	if sequence.length is 0
		return lf
	results = []
	for part in lf when part[0] is sequence[0]
		result = nest(part, sequence[1...], allMatches)
		if result
			if !allMatches
				return result
			results.push(result)
	if results.length > 0
		return results
	return false
generateName = (namePart) ->
	namePart.replace(/\ /g, '_')
exports.TableSpace = ->
	tables = {}

	isPrimitive = (term) ->
		if term[2] is 'Type'
			return term[1]
		table = tables[generateName(term[1])]
		return table.matches.primitive

	currentTable = null

	return {
		attribute: (args...) ->
			currentTable.attribute(args...)
		Table: class Table
			constructor: (lf) ->
				if !(@ instanceof Table)
					return new Table(lf)
				currentTable = @

				idField = 'id'
				fields = []
				indexes = []
				switch lf[0]
					when 'Term'
						tableName = lf[1].replace(/\ /g, '_')
						referenceScheme = idField
					when 'FactType'
						tableName = []
						uniqueIndex =
							type: 'UNIQUE'
							fields: []
						factType = lf[1...-1]
						if factType.length is 2
							booleanAttribute = true
						for factTypePart in factType
							fieldName = factTypePart[1]
							referenceTableName = generateName(factTypePart[1])
							tableName.push(referenceTableName)
							if tables[referenceTableName]?
								# Update to the table's true name, for instance in the case of term form.
								referenceTableName = tables[referenceTableName].tableName
							if factTypePart[0] is 'Term'
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
									required: true,
									index: null
									references: references
								)
						indexes.push(uniqueIndex)
						tableName = tableName.join('-')
				fields.push(
					dataType: 'Serial',
					fieldName: idField,
					required: true,
					index: 'PRIMARY KEY'
					references: null
				)
				tableDefinition = {
					name: tableName
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

				@se = getLineType(lf) + ': ' + toSE(lf)
				@property = 'tables.' + tableName
				@matches = tableDefinition
				@tableName = tableName

				tables[tableName] = @

			attribute: (lf) ->
				if _.isArray(lf)
					se = toSE(lf)
				else if _.isObject(lf)
					{lf, se} = lf
				@se = getLineType(lf) + ': ' + se
				@matches = _.cloneDeep(@matches)
				switch lf[0]
					when 'ConceptType'
						term = lf[1]
						primitive = isPrimitive(term)
						if primitive
							typeName = term[1]
							_.assign @matches,
								idField: null
								primitive: primitive
								referenceScheme: typeName
								fields: [
									dataType: primitive,
									fieldName: typeName,
									required: true,
									index: null
									references: null
								]
					when 'ReferenceScheme'
						term = lf[1]
						@matches.referenceScheme = term[1]
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
							if _.any(bindings, (binding) -> tables[generateName(binding[1][1])].matches.primitive)
								@matches = 'Attribute'
							else
								@matches = 'ForeignKey'
					when 'Definition'
						# Nulling the property just checks that there are no changes to the previous test result.
						@property = null
					when 'TermForm'
						tableName = generateName(lf[1][1])
						tables[tableName] = @
						@property = 'tables.' + tableName
					else
						console.log 'Unknown attribute', require('util').inspect(lf, depth: null)
				return @

		rule: do ->
			attributeBindings = {}

			queryConcat = (query, extra) ->
				whereClause = nest(query, ['Where'])
				extraWhereClause = nest(extra, ['Where'])
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

			variable = checkType 'Variable', (lf) ->
				termName = nest(lf, ['Term'])[1]
				tableName = generateName(termName)
				varNum = nest(lf, ['Number'])[1]
				query = [
					'SelectQuery'
					['Select', []]
					[	'From'
						[	tableName
							termName + '.' + varNum
						]
					]
				]
				extra = []
				if lf.length is 4
					extra =
						if nest(lf, ['AtomicFormulation'])
							atomicFormulation(lf)
						else
							[['Where', quant(lf[3])]]
				if tables[tableName].matches.primitive
					return extra
				query = queryConcat(query, extra)
				return query

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

			atomicFormulation = checkType 'AtomicFormulation', (lf) ->
				factType = nest(lf, ['FactType'])
				factType = factType[1...]
				bindings = roleBindings(lf, ['RoleBinding'], true)

				booleanAttribute = factType.length is 2
				primitiveFactType = true
				tableName = []
				tableAlias = []
				for part in factType
					switch part[0]
						when 'Term'
							termName = part[1]
							binding = _.find(bindings, {termName})
							tableName.push(generateName(termName))
							tableAlias.push(binding.alias)
							if !isPrimitive(part)
								primitiveFactType = false
						when 'Verb'
							verb = part
							verbName = part[1]
							tableName.push(generateName(verbName))
							tableAlias.push(verbName)
				tableName = tableName.join('-')
				tableAlias = tableAlias.join('-')
				
				if booleanAttribute
					return [
						[	'Where'
							[	'Equals'
								['ReferencedField', bindings[0].alias, verb[1]]
								['Boolean', !verb[2]]
							]
						]
					]

				if primitiveFactType
					switch factType[1][1]
						when 'is greater than'
							# Greater than gets reversed into a less than
							return [
								'LessThan'
								bindings[1].embeddedData
								bindings[0].embeddedData
							]
						when 'is less than'
							return [
								'LessThan'
								bindings[0].embeddedData
								bindings[1].embeddedData
							]

				if tables[tableName].matches is 'Attribute'
					attributeBindings[binding.alias] = ['ReferencedField', bindings[0].alias, factType[2][1]]
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
									['ReferencedField', tableAlias, factType[i*2][1]]
									['ReferencedField', binding.alias, 'id']
								]
						)
					]
				]

			atLeastN = (lf, minCard) ->
				if minCard is 0
					return ['Boolean', true]
				query = variable(lf)
				query = queryConcat(query, atomicFormulation(lf))
				select = nest(query, ['Select'])
				if select[1].length is 0
					select[1].push(['Count', '*'])
					return ['GreaterThanOrEqual', query, ['Number', minCard]]

			quant = (lf) ->
				switch lf[0]
					when 'AtMostNQuantification'
						maxCard = nest(lf, ['MaximumCardinality', 'Number'])[1]
						minCard = maxCard + 1
						return ['Not', atLeastN(lf, minCard)]
					when 'AtLeastNQuantification'
						minCard = nest(lf, ['MinimumCardinality', 'Number'])[1]
						return atLeastN(lf, minCard)
					when 'ExistentialQuantification'
						extra = atomicFormulation(lf)
						query = variable(lf)
						if nest(extra, ['Where'])
							query = queryConcat(query, extra)
							return ['Exists', query]
						extra = ['Exists', extra]
						if query.length is 0
							return extra
						return [
							'And'
							query
							extra
						]
					when 'UniversalQuantification'
						query = variable(lf)
						if nest(lf, ['AtomicFormulation'])
							extra = atomicFormulation(lf)
						else
							extra = [['Where', quant(lf[2])]]

						whereClause = nest(extra, ['Where'])
						if whereClause[1][0] is 'Not'
							whereClause[1] = whereClause[1][1]
						else
							whereClause[1] = ['Not', whereClause[1]]

						query = queryConcat(query, extra)
						['Not', ['Exists', query]]
					else
						throw new Error('Unknown quant: ' + lf[0])

			formulation = (lf) ->
				switch lf[0]
					when 'NecessityFormulation'
						['Body', quant(lf[1])]
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
