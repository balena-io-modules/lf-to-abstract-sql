_ = require 'lodash'

# Inherit from the sbvr-parser's sbvr-helper module.
module.exports = exports = require('sbvr-parser/test/sbvr-helper.coffee')
{toSE} = exports

# Gets the type of the line (eg Term/Rule) and adds spaces if necessary (eg "SynonymousForm" to "Synonymous Form")
exports.getLineType = getLineType = (lf) -> lf[0].replace(/([A-Z])/g, ' $1').trim()

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
						for factTypePart in lf[1...-1]
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

				@se = getLineType(lf) + ': ' + toSE(lf)
				@property = 'tables.' + tableName
				@matches = tableDefinition
				@tableName = tableName

				tables[tableName] = @

			attribute: (lf) ->
				@se = getLineType(lf) + ': ' + toSE(lf)
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
				return @
	}
