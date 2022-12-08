const _ = require('lodash');
const { LFOptimiser } = require('@balena/sbvr-parser/lf-optimiser');

// Inherit from the sbvr-parser's sbvr-helper module.
module.exports = exports = require('@balena/sbvr-parser/test/sbvr-helper');
const { toSE, rule, getLineType } = exports;

const nest = function (lf, sequence, allMatches) {
	if (lf === false) {
		return false;
	}
	if (allMatches == null) {
		allMatches = false;
	}
	if (sequence.length === 0) {
		return lf;
	}
	if (lf[0] === sequence[0]) {
		return nest(lf, sequence.slice(1), allMatches);
	}
	const results = [];
	for (let part of lf) {
		if (part != null && part[0] === sequence[0]) {
			const result = nest(part, sequence.slice(1), allMatches);
			if (result) {
				if (!allMatches) {
					return result;
				}
				results.push(result);
			}
		}
	}
	if (results.length > 0) {
		return results;
	}
	return false;
};

const generateName = (namePart) => namePart;

const generateFieldName = function (factType) {
	if (factType[1][1] === 'has') {
		// If it's a has we just use the term
		return factType[2][1];
	}
	return factType[1][1] + '-' + factType[2][1];
};

const createdAtField = {
	dataType: 'Date Time',
	fieldName: 'created at',
	required: true,
	defaultValue: 'CURRENT_TIMESTAMP',
};

const modifiedAtField = {
	dataType: 'Date Time',
	fieldName: 'modified at',
	required: true,
	defaultValue: 'CURRENT_TIMESTAMP',
};

exports.TableSpace = function () {
	const tables = {};
	const synonyms = {};

	const resolveSynonym = (name) =>
		synonyms[name] != null ? synonyms[name] : name;
	const getTable = (name) => tables[resolveSynonym(generateName(name))];

	const isPrimitive = function (term) {
		if (term[2] === 'Type') {
			return term[1];
		}
		const table = getTable(term[1]);
		return table.table.primitive;
	};
	const parseFactType = function (factType, bindings) {
		let binding;
		let verb;
		let primitiveFactType = true;
		const tableName = [];
		const tableAlias = [];
		for (let part of factType) {
			switch (part[0]) {
				case 'Term':
					const termName = part[1];
					binding =
						bindings != null
							? bindings.find((b) => b.termName === termName)
							: undefined;
					tableName.push(generateName(termName));
					tableAlias.push(binding != null ? binding.alias : undefined);
					if (!isPrimitive(part)) {
						primitiveFactType = false;
					}
					break;
				case 'Verb':
					verb = part;
					const verbName = part[1];
					tableName.push(generateName(verbName));
					tableAlias.push(verbName);
					break;
			}
		}
		return {
			tableName: tableName.map(resolveSynonym).join('-'),
			tableAlias: tableAlias.join('-'),
			verb,
			primitiveFactType,
			booleanAttribute: factType.length === 2,
			binding,
		};
	};

	let currentTable = null;

	class Table {
		constructor(lf, currentVocab) {
			let booleanAttribute;
			let dataType;
			let factType;
			let fieldName;
			let modelName;
			let name;
			let primitive;
			let references;
			let referenceScheme;
			let resourceName;
			let tableName;
			if (currentVocab == null) {
				currentVocab = 'Default';
			}
			currentTable = this;

			const idField = 'id';
			const fields = [createdAtField, modifiedAtField];
			const indexes = [];
			switch (lf[0]) {
				case 'Term':
					modelName = lf[1];
					tableName = generateName(lf[1]);
					referenceScheme = idField;
					break;
				case 'FactType':
					modelName = _(lf)
						.without('FactType')
						.reject({ 0: 'Attributes' })
						.map(1)
						.join(' ');
					tableName = [];
					resourceName = [];
					const uniqueIndex = {
						type: 'UNIQUE',
						fields: [],
					};
					factType = lf.slice(1, -1);
					if (factType.length === 2) {
						booleanAttribute = true;
					} else {
						for (let i = 0; i < factType.length; i++) {
							const factTypePart = factType[i];
							name = generateName(factTypePart[1]);
							tableName.push(name);
							const referenceResourceName = resolveSynonym(name);
							resourceName.push(referenceResourceName);
							if (factTypePart[0] === 'Term') {
								fieldName =
									i === 0
										? generateName(factTypePart[1])
										: generateFieldName(
												factType.slice(i - 2, +i + 1 || undefined),
										  );
								uniqueIndex.fields.push(fieldName);
								primitive = isPrimitive(factTypePart);

								const f = {
									fieldName,
									required: true,
								};
								if (primitive) {
									f.dataType = primitive;
								} else {
									f.dataType = 'ForeignKey';
									f.references = {
										fieldName: 'id',
										resourceName: referenceResourceName,
									};
								}
								fields.push(f);
							}
						}
						indexes.push(uniqueIndex);
						tableName = tableName.join('-');
						resourceName = resourceName.join('-');
					}
					break;
			}
			fields.push({
				dataType: 'Serial',
				fieldName: idField,
				required: true,
				index: 'PRIMARY KEY',
			});
			let tableDefinition = {
				name: tableName,
				resourceName: resourceName != null ? resourceName : tableName,
				modelName,
				primitive: false,
				idField,
				fields,
				indexes,
				triggers: [
					{
						fnName: 'trigger_update_modified_at',
						level: 'ROW',
						operation: 'UPDATE',
						when: 'BEFORE',
					},
				],
			};
			if (referenceScheme != null) {
				tableDefinition.referenceScheme = referenceScheme;
			}

			// If we're a boolean attribute then we override the definition.
			if (booleanAttribute) {
				getTable(factType[0][1]).table.fields.push({
					dataType: 'Boolean',
					fieldName: factType[1][1],
					required: true,
				});
				tableDefinition = 'BooleanAttribute';
				this.matches = undefined;
			} else {
				this.matches = _.cloneDeep(tableDefinition);
			}

			this.se = getLineType(lf) + ': ' + toSE(lf, currentVocab);
			this.property = 'tables.' + tableDefinition.resourceName;
			this.table = tableDefinition;
			this.tableName = tableName;

			tables[tableName] = this;
		}

		attribute(lf, currentVocab) {
			let se;
			let baseTable;
			let card;
			let fieldName;
			let typeName;
			let term;
			if (currentVocab == null) {
				currentVocab = 'Default';
			}
			if (Array.isArray(lf)) {
				se = toSE(lf, currentVocab);
			} else if (_.isObject(lf)) {
				({ lf, se } = lf);
			}
			this.se = getLineType(lf) + ': ' + se;
			switch (lf[0]) {
				case 'ConceptType':
					term = lf[1];
					const primitive = isPrimitive(term);
					if (primitive) {
						typeName = term[1];
						const primitiveField = {
							dataType: primitive,
							fieldName: typeName,
							required: true,
						};
						Object.assign(this.table, {
							idField: null,
							primitive,
							referenceScheme: typeName,
							fields: [createdAtField, modifiedAtField, primitiveField],
						});
						this.matches = undefined;
					} else {
						typeName = term[1];
						this.table.fields.push({
							dataType: 'ConceptType',
							fieldName: typeName,
							required: true,
							references: {
								fieldName: 'id',
								resourceName: generateName(typeName),
							},
						});
						this.property = 'tables.' + this.table.resourceName;
						this.matches = _.cloneDeep(this.table);
					}
					break;
				case 'ReferenceScheme':
					term = lf[1];
					this.table.referenceScheme = term[1];
					this.property = 'tables.' + this.table.resourceName;
					this.matches = _.cloneDeep(this.table);
					break;
				case 'Necessity':
					lf = nest(lf, [
						'Rule',
						'NecessityFormulation',
						'UniversalQuantification',
					]);
					let quant = nest(lf, ['ExactQuantification']);
					if (quant) {
						card = nest(quant, ['Cardinality', 'Number']);
					} else {
						quant = nest(lf, ['AtMostNQuantification']);
						card = nest(quant, ['MaximumCardinality', 'Number']);
					}
					if (card && card[1] === 1) {
						const bindings = nest(
							quant,
							['AtomicFormulation', 'RoleBinding'],
							true,
						)[0];
						const factType = nest(quant, ['AtomicFormulation', 'FactType']);
						const primitiveTable = bindings
							.map((binding) => getTable(binding[1][1]).table)
							.find((table) => table.primitive);
						baseTable = getTable(factType[1][1]).table;

						if (baseTable === primitiveTable) {
							// If the primitive table is also the base table then it's actually a unique
							// constraint rather than a cardinality constraint
							this.baseTable.fields.find(
								(field) => field.fieldName === primitiveTable.name,
							).index = 'UNIQUE';
							this.matches = _.cloneDeep(this.baseTable);
						} else {
							if (primitiveTable) {
								this.table = 'Attribute';
							} else {
								this.table = 'ForeignKey';
							}
							const dataType =
								primitiveTable != null && primitiveTable.primitive != null
									? primitiveTable.primitive
									: 'ForeignKey';

							this.baseTable = baseTable;

							const required = quant[0] === 'ExactQuantification';
							fieldName = _(factType)
								.slice(2)
								.map(1)
								.reject((v) => v === 'has')
								.join('-');
							const field = this.baseTable.fields.find(
								(f) => f.fieldName === fieldName,
							);
							if (field) {
								field.required = required;
							} else {
								this.baseTable.fields.push({
									dataType,
									fieldName,
									required,
									references: {
										fieldName: primitiveTable ? null : 'id',
										resourceName: _.last(factType)[1],
									},
								});
							}
							this.property = 'tables.' + this.baseTable.resourceName;
							this.matches = _.cloneDeep(this.baseTable);
						}
					}
					break;
				case 'Definition':
					const definition = lf[1];
					if (definition[0] === 'Enum') {
						const lastField = _.last(this.baseTable.fields);
						lastField.checks = [
							['In', ['Field', lastField.fieldName], ...definition.slice(1)],
						];
						this.property = 'tables.' + this.baseTable.resourceName;
						this.matches = _.cloneDeep(this.baseTable);
					} else {
						// Nulling the property just checks that there are no changes to the previous test result.
						this.property = null;
					}
					break;
				case 'SynonymousForm':
					const { tableName } = parseFactType(lf[1]);
					tables[tableName] = this;
					break;
				case 'Synonym':
					const synonym = generateName(lf[1][1]);
					synonyms[synonym] = this.tableName;
					this.property = 'synonyms';
					this.matches = _.clone(synonyms);
					break;
				case 'TermForm':
					const termFormSynonym = generateName(lf[1][1]);
					synonyms[termFormSynonym] = this.tableName;
					this.property = 'synonyms';
					this.matches = _.clone(synonyms);
					break;
				case 'ReferenceType':
					const idx = this.baseTable.fields.findIndex(
						(f) => f.dataType === 'ForeignKey',
					);
					this.baseTable.fields[idx].references.type = lf[1];
					this.matches = _.cloneDeep(this.baseTable);
					break;
				default:
					console.log(
						'Unknown attribute',
						require('util').inspect(lf, { depth: null }),
					);
			}
			return this;
		}
	}

	return {
		attribute(...args) {
			return currentTable.attribute(...args);
		},
		Table: (...args) => new Table(...args),
		rule: (function () {
			let attributeBindings = {};

			const queryConcat = function (query, extra) {
				const whereClause = nest(query, ['Where']);
				const extraWhereClause = nest(extra, ['Where']);
				if (extra === extraWhereClause) {
					extra = [extra];
				}
				if (whereClause && extraWhereClause) {
					whereClause[1] = ['And', whereClause[1], extraWhereClause[1]];
					extra = _.reject(extra, { 0: 'Where' });
				}
				return query.concat(extra);
			};

			const checkType = function (type, allMatches, fn) {
				if (fn == null) {
					fn = allMatches;
					allMatches = null;
				}
				return function (lf) {
					const subLF = nest(lf, [type], allMatches);
					if (!subLF) {
						console.error(lf);
						throw new Error('No entry for: ' + type);
					}
					return fn(subLF);
				};
			};

			const junction = function (fn) {
				const junctionFn = function (lf) {
					let type;
					if (lf[0] === 'Disjunction') {
						type = 'Or';
					} else if (lf[0] === 'Conjunction') {
						type = 'And';
					} else {
						return fn(lf);
					}

					const results = lf.slice(1).map((part) => {
						const result = junctionFn(part);
						const whereClause = nest(result, ['Where']);
						if (whereClause) {
							return whereClause[1];
						} else {
							return result;
						}
					});
					return ['Where', [type, ...results]];
				};
				return junctionFn;
			};

			const variable = checkType('Variable', function (lf) {
				const term = nest(lf, ['Term']);
				const termName = term[1];
				const varNum = nest(lf, ['Number'])[1];
				const query = [
					'SelectQuery',
					['Select', []],
					[
						'From',
						[
							'Alias',
							['Table', generateName(termName)],
							termName + '.' + varNum,
						],
					],
				];
				let extra = [];
				if (lf.length === 4) {
					extra = quant(lf[3]);
				}
				if (isPrimitive(term)) {
					return extra;
				}
				return queryConcat(query, extra);
			});

			const roleBindings = checkType('RoleBinding', true, (lf) =>
				lf.map(function (binding) {
					const term = nest(binding, ['Term']);
					const termName = term[1];
					const alias = termName + '.' + binding[2];
					return {
						termName,
						alias,
						embeddedData:
							attributeBindings[alias] != null
								? attributeBindings[alias]
								: term[3],
					};
				}),
			);

			const atomicFormulation = junction(
				checkType('AtomicFormulation', function (lf) {
					let factType = nest(lf, ['FactType']);
					factType = factType.slice(1);
					const bindings = roleBindings(lf, ['RoleBinding'], true);

					const {
						tableName,
						tableAlias,
						verb,
						primitiveFactType,
						booleanAttribute,
						binding,
					} = parseFactType(factType, bindings);

					if (booleanAttribute) {
						return [
							'Where',
							[
								'Equals',
								['ReferencedField', bindings[0].alias, verb[1]],
								['Boolean', !verb[2]],
							],
						];
					}

					if (primitiveFactType) {
						const comparison = (() => {
							switch (factType[1][1]) {
								case 'is greater than':
									// Greater than gets reversed into a less than
									return [
										'LessThan',
										bindings[1].embeddedData,
										bindings[0].embeddedData,
									];
								case 'is less than':
									return [
										'LessThan',
										bindings[0].embeddedData,
										bindings[1].embeddedData,
									];
								case 'has':
									attributeBindings[bindings[1].alias] = [
										'CharacterLength',
										bindings[0].embeddedData,
									];
									return attributeBindings[bindings[1].alias];
								default:
									throw new Error(
										'Unknown primitive fact type: ' + factType[1][1],
									);
							}
						})();
						if (factType[1][2]) {
							return ['Not', comparison];
						}
						return comparison;
					}

					const linkTable = getTable(tableName);

					if (linkTable.table === 'Attribute') {
						attributeBindings[binding.alias] = [
							'ReferencedField',
							bindings[0].alias,
							generateFieldName(factType),
						];
						return attributeBindings[binding.alias];
					}

					return [
						['From', ['Alias', ['Table', tableName], tableAlias]],
						[
							'Where',
							['And'].concat(
								bindings.map(function (bind, i) {
									const baseIdentifierName = factType[i * 2][1];
									const foreignKeyField = _.filter(
										linkTable.table.fields,
										(field) =>
											field.dataType === 'ForeignKey' &&
											field.references.resourceName === baseIdentifierName,
									)[0];

									return [
										'Equals',
										['ReferencedField', tableAlias, foreignKeyField.fieldName],
										['ReferencedField', bind.alias, 'id'],
									];
								}),
							),
						],
					];
				}),
			);

			const compareQuery = function (lf) {
				let query = variable(lf);
				query = queryConcat(query, atomicFormulation(lf));
				const select = nest(query, ['Select']);
				if (select[1].length === 0) {
					select[1].push(['Count', '*']);
				}
				return query;
			};

			const atLeastN = function (lf, minCard) {
				if (minCard === 0) {
					return ['Boolean', true];
				}
				return ['GreaterThanOrEqual', compareQuery(lf), ['Number', minCard]];
			};

			const quant = junction(function (lf) {
				if (lf[0] === 'AtomicFormulation') {
					return atomicFormulation(lf);
				}
				const whereBody = (function () {
					let query;
					let extra;
					let minCard;
					switch (lf[0]) {
						case 'AtMostNQuantification':
							const maxCard = nest(lf, ['MaximumCardinality', 'Number'])[1];
							minCard = maxCard + 1;
							return ['Not', atLeastN(lf, minCard)];
						case 'AtLeastNQuantification':
							minCard = nest(lf, ['MinimumCardinality', 'Number'])[1];
							return atLeastN(lf, minCard);
						case 'ExactQuantification':
							const card = nest(lf, ['Cardinality', 'Number']);
							return ['Equals', compareQuery(lf), card];
						case 'ExistentialQuantification':
							extra = quant(lf[2]);
							query = variable(lf);
							if (nest(extra, ['Where'])) {
								query = queryConcat(query, extra);
								return ['Exists', query];
							}
							extra = ['Exists', extra];
							if (query.length === 0) {
								return extra;
							}
							if (query[0] === 'Where') {
								query = query[1];
							}
							return ['And', query, extra];
						case 'UniversalQuantification':
							query = variable(lf);
							extra = quant(lf[2]);

							const whereClause = nest(extra, ['Where']);
							if (whereClause[1][0] === 'Not') {
								whereClause[1] = whereClause[1][1];
							} else {
								whereClause[1] = ['Not', whereClause[1]];
							}

							query[1][1].push(['Count', '*']);
							query = queryConcat(query, extra);
							return ['Equals', query, ['Number', 0]];
						default:
							throw new Error('Unknown quant: ' + lf[0]);
					}
				})();
				return ['Where', whereBody];
			});

			const formulation = function (lf) {
				switch (lf[0]) {
					case 'NecessityFormulation':
						return ['Body', quant(lf[1])[1]];
					default:
						throw new Error('Unknown formulation: ' + lf[0]);
				}
			};

			return function (...args) {
				attributeBindings = {};
				let lf = rule(...args);
				lf = LFOptimiser.match(lf, 'Process');
				lf[1] = formulation(lf[1]);
				return {
					se: getLineType(lf) + ': ' + toSE(lf),
					ruleSQL: lf,
				};
			};
		})(),
	};
};

const stripLinkTable = (sql, tableAliases) =>
	_.remove(sql, function (sqlPart) {
		if (!Array.isArray(sqlPart)) {
			return false;
		}

		// Remove [ 'From', [ 'Alias', [ 'Table', tableName' ], tableAlias ] ]
		if (sqlPart[0] === 'From' && tableAliases.includes(sqlPart[1][2])) {
			return true;
		}

		const refFields = tableAliases.map((tableAlias) => [
			'ReferencedField',
			tableAlias,
			'id',
		]);
		// Remove [ 'Equals', refField, linkField ] or [ 'Equals', linkField, refField ]
		if (
			sqlPart[0] === 'Equals' &&
			(refFields.some((refField) => _.isEqual(sqlPart[1], refField)) ||
				refFields.some((refField) => _.isEqual(sqlPart[2], refField)))
		) {
			return true;
		}

		if (stripLinkTable(sqlPart, tableAliases).length > 0) {
			// Handle ANDs we've dropped down to one
			if (sqlPart[0] === 'And' && sqlPart.length === 2) {
				sqlPart.splice(0, sqlPart.length, ...sqlPart[1]);
			}
		}
		return false;
	});
exports.stripLinkTable = function (tableAlias, ruleObj) {
	if (!Array.isArray(tableAlias)) {
		tableAlias = [tableAlias];
	}
	stripLinkTable(ruleObj.ruleSQL, tableAlias);
	return ruleObj;
};
