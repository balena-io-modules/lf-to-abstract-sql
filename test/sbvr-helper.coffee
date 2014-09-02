_ = require 'lodash'
LFOptimiser = require('sbvr-parser/lf-optimiser').LFOptimiser

# Inherit from the sbvr-parser's sbvr-helper module.
module.exports = exports = require('sbvr-parser/test/sbvr-helper.coffee')
{toSE, rule} = exports

# Gets the type of the line (eg Term/Rule) and adds spaces if necessary (eg "SynonymousForm" to "Synonymous Form")
exports.getLineType = getLineType = (lf) -> lf[0].replace(/([A-Z])/g, ' $1').trim()

nest = (lf, sequence, allMatches = false) ->
	if sequence.length is 0
		return lf
	results = []
	for part in lf[1...] when part[0] is sequence[0]
		result = nest(part, sequence[1...])
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
						card = nest(lf, ['Rule', 'NecessityFormulation', 'UniversalQuantification', 'ExactQuantification', 'Cardinality', 'Number'])
						if card and card[1] is 1
							@matches = 'Attribute'
					when 'Definition'
						# Nulling the property just checks that there are no changes to the previous test result.
						@property = null
					else
						console.log 'Unknown attribute', require('util').inspect(lf, depth: null)
				return @

		rule: do ->

			mapParts = (parts) ->
				parts.map (part) ->
					if _.isArray(part)
						transform(part)
					else
						part

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

			variable = (lf) ->
				varNum = nest(lf, ['Number'])[1]
				termName = nest(lf, ['Term'])[1]
				[	'SelectQuery'
					['Select', []]
					[	'From'
						[	termName
							termName + '.' + varNum
						]
					]
				]

			roleBindings = checkType 'RoleBinding', true, (lf) ->
				lf.map (binding) ->
					termName = nest(binding, ['Term'])[1]
					return {
						termName: termName
						alias: termName + '.' + binding[2]
					}

			atomicFormulation = checkType 'AtomicFormulation', (lf) ->
				factType = nest(lf, ['FactType'])
				factType = factType[1...]
				bindings = roleBindings(lf, ['RoleBinding'], true)
				tableName = []
				tableAlias = []
				for part in factType
					switch part[0]
						when 'Term'
							termName = part[1]
							binding = _.find(bindings, {termName})
							tableName.push(generateName(termName))
							tableAlias.push(binding.alias)
						when 'Verb'
							verb = part[1]
							tableName.push(generateName(verb))
							tableAlias.push(verb)
				tableName = tableName.join('-')
				tableAlias = tableAlias.join('-')
				[	[	'From'
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

			quant = (lf) ->
				switch lf[0]
					when 'AtLeastNQuantification'
						minCard = nest(lf, ['MinimumCardinality', 'Number'])[1]
						if minCard is 0
							return ['Boolean', true]
						query = variable(lf[2])
						select = nest(query, ['Select'])
						if select[1].length is 0
							select[1].push(['Count', '*'])
							return ['GreaterThanOrEqual', query, ['Number', minCard]]
					when 'ExistentialQuantification'
						query = variable(lf[1])
						query = query.concat(atomicFormulation(lf))
						return ['Exists', query]
					else
						throw new Error('Unknown quant: ' + lf[0])

			transform = (lf) ->
				switch lf[0]
					when 'NecessityFormulation'
						['Body', mapParts(lf[1...])...]
					when 'UniversalQuantification'
						query = variable(lf[1])
						whereBody = quant(lf[2])
						query.push(
							[	'Where'
								[	'Not'
									whereBody
								]
							]
						)
						['Not', ['Exists', query]]
					else
						[lf[0], mapParts(lf[1...])...]

			return (args...) ->
				lf = rule(args...)
				lf = LFOptimiser.match(lf, 'Process')
				return {
					se: getLineType(lf) + ': ' + toSE(lf)
					ruleSQL: transform(lf)
				}
	}
