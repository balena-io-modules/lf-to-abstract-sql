# Inherit from the sbvr-parser's sbvr-helper module.
module.exports = exports = require('sbvr-parser/test/sbvr-helper.coffee')
{toSE} = exports

# Gets the type of the line (eg Term/Rule) and adds spaces if necessary (eg "SynonymousForm" to "Synonymous Form")
exports.getLineType = getLineType = (lf) -> lf[0].replace(/([A-Z])/g, ' $1').trim()
exports.table = (lf) ->
	idField = 'id'
	fields = []
	indexes = []
	switch lf[0]
		when 'Term'
			tableName =lf[1].replace(/\ /g, '_')
			referenceScheme = idField
		when 'FactType'
			tableName = []
			uniqueIndex =
				type: 'UNIQUE'
				fields: []
			for factTypePart in lf[1...-1]
				fieldName = factTypePart[1]
				referenceTableName = factTypePart[1].replace(/\ /g, '_')
				tableName.push(referenceTableName)
				if factTypePart[0] is 'Term'
					uniqueIndex.fields.push(fieldName)
					fields.push(
						dataType: 'ForeignKey'
						fieldName: fieldName
						required: true,
						index: null
						references:
							fieldName: 'id'
							tableName: referenceTableName
					)
			indexes.push(uniqueIndex)
			tableName = tableName.join('-')
	fields.push(
		dataType: 'Serial',
		fieldName: idField,
		required: true,
		index: 'PRIMARY KEY'
		references: undefined
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
	return {
		se: getLineType(lf) + ': ' + toSE(lf)
		property: 'tables.' + tableName
		matches: tableDefinition
	}
