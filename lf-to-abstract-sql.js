!function(root, factory) {
    "function" == typeof define && define.amd ? define([ "require", "exports", "ometa-core", "./sbvr-compiler-libs", "lodash" ], factory) : "object" == typeof exports ? factory(require, exports, require("ometa-js").core) : factory(function(moduleName) {
        return root[moduleName];
    }, root, root.OMeta);
}(this, function(require, exports, OMeta) {
    var SBVRCompilerLibs = require("./sbvr-compiler-libs").SBVRCompilerLibs, _ = require("lodash"), LF2AbstractSQL = exports.LF2AbstractSQL = SBVRCompilerLibs._extend({
        Number: function() {
            var $elf = this, _fromIdx = this.input.idx, num;
            this._form(function() {
                this._applyWithArgs("exactly", "Number");
                num = this._apply("number");
                return this._pred(!isNaN(num));
            });
            return num;
        },
        Real: function() {
            var $elf = this, _fromIdx = this.input.idx, num;
            this._form(function() {
                this._applyWithArgs("exactly", "Real");
                num = this._apply("number");
                return this._pred(!isNaN(num));
            });
            return [ "Real", num ];
        },
        Integer: function() {
            var $elf = this, _fromIdx = this.input.idx, num;
            this._form(function() {
                this._applyWithArgs("exactly", "Integer");
                num = this._apply("number");
                return this._pred(!isNaN(num));
            });
            return [ "Integer", num ];
        },
        Text: function() {
            var $elf = this, _fromIdx = this.input.idx, text;
            this._form(function() {
                this._applyWithArgs("exactly", "Text");
                return text = this.anything();
            });
            return [ "Text", text ];
        },
        Value: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._or(function() {
                return this._apply("Real");
            }, function() {
                return this._apply("Integer");
            }, function() {
                return this._apply("Text");
            });
        },
        Identifier: function() {
            var $elf = this, _fromIdx = this.input.idx, name, num, type, vocab;
            num = "";
            this._form(function() {
                type = function() {
                    switch (this.anything()) {
                      case "Name":
                        return "Name";

                      case "Term":
                        return "Term";

                      default:
                        throw this._fail();
                    }
                }.call(this);
                name = this.anything();
                vocab = this.anything();
                return this._opt(function() {
                    return this._or(function() {
                        return num = this._apply("Number");
                    }, function() {
                        return this._apply("Value");
                    });
                });
            });
            return {
                type: type,
                name: name,
                num: num,
                vocab: vocab
            };
        },
        IdentifierName: function() {
            var $elf = this, _fromIdx = this.input.idx, identifierName, resourceName;
            identifierName = this.anything();
            resourceName = this._applyWithArgs("GetResourceName", identifierName);
            this._or(function() {
                return this._pred(!this.tables.hasOwnProperty(resourceName));
            }, function() {
                console.error("We already have an identifier with a name of: " + identifierName);
                return this._pred(!1);
            });
            this._applyWithArgs("CreateTable", resourceName, identifierName);
            return identifierName;
        },
        Attributes: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrOrder, attributeName, attributeVals, attributes;
            return this._or(function() {
                return this._apply("end");
            }, function() {
                this._form(function() {
                    this._applyWithArgs("exactly", "Attributes");
                    attributes = {};
                    return this._many(function() {
                        this._form(function() {
                            attributeName = this.anything();
                            return attributeVals = this._many(function() {
                                return this.anything();
                            });
                        });
                        return attributes[attributeName] = attributeVals;
                    });
                });
                attrOrder = [ "DatabaseTableName", "DatabaseIDField", "DatabasePrimitive", "TermForm", "ConceptType", "SynonymousForm", "Synonym", "ReferenceScheme", "ForeignKey", "Attribute", "Unique" ];
                return function() {
                    _.each(attrOrder, function(attributeName) {
                        attributes.hasOwnProperty(attributeName) && $elf._applyWithArgs.apply($elf, [ "Attr" + attributeName, termOrFactType ].concat(attributes[attributeName]));
                    });
                    return _(attributes).omit(attrOrder).each(function(attributeVals, attributeName) {
                        $elf._applyWithArgs.apply($elf, [ "ApplyFirstExisting", [ "Attr" + attributeName, "DefaultAttr" ], [ termOrFactType ].concat(attributeVals) ]);
                    });
                }.call(this);
            });
        },
        DefaultAttr: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, anything;
            return anything = this.anything();
        },
        AttrConceptType: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, conceptTable, conceptTerm, conceptType, dataType, fieldID, identifierTable, primitive, references, vocab;
            conceptTerm = this._form(function() {
                this._applyWithArgs("exactly", "Term");
                conceptType = this.anything();
                return vocab = this.anything();
            });
            (function() {
                this.termForms[termOrFactType] && (termOrFactType = this.termForms[termOrFactType]);
            }).call(this);
            this.vocabularies[termOrFactType[2]].ConceptTypes[termOrFactType] = conceptTerm;
            primitive = this._applyWithArgs("IsPrimitive", conceptTerm);
            conceptTable = this._applyWithArgs("GetTable", conceptType);
            identifierTable = this._applyWithArgs("GetTable", termOrFactType[1]);
            this._or(function() {
                this._pred(primitive !== !1 && conceptType === primitive);
                dataType = primitive;
                this._opt(function() {
                    this._pred(identifierTable.hasOwnProperty("referenceScheme"));
                    fieldID = this._applyWithArgs("GetTableFieldID", identifierTable, identifierTable.referenceScheme);
                    this._pred(fieldID !== !1);
                    return identifierTable.fields.splice(fieldID, 1);
                });
                return identifierTable.referenceScheme = conceptType;
            }, function() {
                dataType = "ConceptType";
                return references = this._applyWithArgs("GetReference", conceptTable);
            });
            this._applyWithArgs("AddTableField", identifierTable, conceptType, dataType, !0, null, references);
            return this._applyWithArgs("AddRelationship", identifierTable, [ [ "Verb", "has" ], conceptTerm ], conceptType, references);
        },
        AttrDatabaseIDField: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, fieldID, idField, table, tableID;
            idField = this.anything();
            tableID = this._applyWithArgs("GetTableID", termOrFactType);
            table = this._applyWithArgs("GetTable", tableID);
            return this._or(function() {
                return this._pred(_.isString(table));
            }, function() {
                fieldID = this._applyWithArgs("AddTableField", table, idField, "Serial", !0, "PRIMARY KEY");
                this._opt(function() {
                    this._pred(fieldID !== !1);
                    return table.fields[fieldID].index = "PRIMARY KEY";
                });
                return table.idField = idField;
            });
        },
        AttrReferenceScheme: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, fieldID, referenceScheme, table, tableID;
            referenceScheme = this.anything();
            referenceScheme = this._or(function() {
                this._pred(_.isArray(referenceScheme));
                return referenceScheme[1];
            }, function() {
                return referenceScheme;
            });
            tableID = this._applyWithArgs("GetTableID", termOrFactType);
            table = this._applyWithArgs("GetTable", tableID);
            return this._or(function() {
                return this._pred(_.isString(table));
            }, function() {
                this._opt(function() {
                    this._pred(table.hasOwnProperty("referenceScheme"));
                    fieldID = this._applyWithArgs("GetTableFieldID", table, table.referenceScheme);
                    this._pred(fieldID !== !1);
                    return table.fields[fieldID].fieldName = referenceScheme;
                });
                return table.referenceScheme = referenceScheme;
            });
        },
        AttrDatabaseTableName: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, baseTable, fieldName, linkResourceName, references, table, tableID, tableName;
            tableName = this.anything();
            tableID = this._applyWithArgs("GetTableID", termOrFactType);
            table = this._applyWithArgs("GetTable", tableID);
            this._or(function() {
                return this._pred(_.isString(table));
            }, function() {
                return table.name = tableName;
            });
            return this._opt(function() {
                this._pred(_.isArray(termOrFactType[0]) && termOrFactType.length > 2);
                linkResourceName = this._applyWithArgs("GetResourceName", termOrFactType);
                baseTable = this._applyWithArgs("GetTable", termOrFactType[0][1]);
                fieldName = this._applyWithArgs("FactTypeFieldName", [ [ "Term", linkResourceName ], [ "Verb", "has" ], termOrFactType[0] ]);
                references = this._applyWithArgs("GetReference", table, fieldName);
                this._applyWithArgs("AddRelationship", baseTable, termOrFactType.slice(1), baseTable.idField, references, !0);
                return this._applyWithArgs("AddRelationship", baseTable, termOrFactType, baseTable.idField, references, !0);
            });
        },
        AttrDatabasePrimitive: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrVal, tableID;
            attrVal = this.anything();
            tableID = this._applyWithArgs("GetTableID", termOrFactType);
            return this.GetTable(tableID).primitive = attrVal;
        },
        AttrDatabaseAttribute: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, attrVal, attributeTable, baseTable, fieldID, fieldName, linkResourceName;
            attrVal = this.anything();
            return this._opt(function() {
                this._pred(attrVal);
                this.attributes[factType] = attrVal;
                linkResourceName = this._applyWithArgs("GetResourceName", factType);
                delete this.relationships[linkResourceName];
                this.tables[linkResourceName] = "Attribute";
                baseTable = this._applyWithArgs("GetTable", factType[0][1]);
                fieldName = this._applyWithArgs("FactTypeFieldName", factType);
                attributeTable = this._applyWithArgs("GetTable", factType[2][1]);
                fieldID = this._applyWithArgs("GetTableFieldID", baseTable, fieldName);
                baseTable.fields[fieldID].dataType = attributeTable.primitive;
                this._applyWithArgs("AddRelationship", baseTable, factType, fieldName);
                return this._applyWithArgs("AddRelationship", baseTable, factType.slice(1), fieldName);
            });
        },
        AttrForeignKey: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, baseTable, factTypeResourceName, fieldID, fkName, fkTable, foreignTerm, linkResourceName, references, required;
            required = this.anything();
            baseTable = this._applyWithArgs("GetTable", factType[0][1]);
            foreignTerm = factType[2][1];
            fkName = this._applyWithArgs("FactTypeFieldName", factType);
            fkTable = this._applyWithArgs("GetTable", foreignTerm);
            this._opt(function() {
                this._pred(baseTable.idField == fkName);
                fieldID = this._applyWithArgs("GetTableFieldID", baseTable, fkName);
                this._pred(fieldID !== !1);
                return baseTable.fields.splice(fieldID, 1);
            });
            references = this._applyWithArgs("GetReference", fkTable);
            fieldID = this._applyWithArgs("AddTableField", baseTable, fkName, "ForeignKey", required, null, references);
            this._applyWithArgs("AddRelationship", baseTable, factType.slice(1), fkName, references);
            factTypeResourceName = this._applyWithArgs("GetResourceName", factType);
            _.each($elf.synonymousForms[factTypeResourceName], function(synForm) {
                var actualFactType = $elf.MappedFactType(synForm);
                if (0 === actualFactType[0][3]) $elf.AddRelationship(baseTable, synForm.slice(1), fkName, references); else {
                    var synResourceName = $elf.GetResourceName(synForm[0][1]), reverseReferences = $elf.GetReference(baseTable, fkName);
                    $elf.AddRelationship(synResourceName, synForm.slice(1), references.fieldName, reverseReferences);
                }
            });
            this._opt(function() {
                this._pred(fieldID);
                return baseTable.fields[fieldID].required = required;
            });
            linkResourceName = this._applyWithArgs("GetResourceName", factType);
            delete this.relationships[linkResourceName];
            return this.tables[linkResourceName] = "ForeignKey";
        },
        AttrUnique: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, baseTable, fieldID, required, uniqueField;
            required = this.anything();
            baseTable = this._applyWithArgs("GetTable", factType);
            this._opt(function() {
                this._pred("Attribute" === baseTable || "ForeignKey" === baseTable);
                return baseTable = this._applyWithArgs("GetTable", factType[0][1]);
            });
            uniqueField = this._applyWithArgs("FactTypeFieldName", factType);
            fieldID = this._applyWithArgs("GetTableFieldID", baseTable, uniqueField);
            this._pred(fieldID !== !1);
            return baseTable.fields[fieldID].index = "UNIQUE";
        },
        AttrSynonym: function(term) {
            var $elf = this, _fromIdx = this.input.idx, synonym;
            synonym = this.anything();
            return this.synonyms[synonym[1]] = term[1];
        },
        AttrSynonymousForm: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, fieldName, fkTable, fromTable, linkRef, linkTable, references, resourceName, synForm;
            synForm = this.anything();
            this._applyWithArgs("AddFactType", synForm, factType);
            return this._or(function() {
                return this._pred(this.IsPrimitive(factType[0]) || this.IsPrimitive(synForm[0]));
            }, function() {
                resourceName = this._applyWithArgs("GetResourceName", factType);
                (function() {
                    null == this.synonymousForms[resourceName] && (this.synonymousForms[resourceName] = []);
                    return this.synonymousForms[resourceName].push(synForm);
                }).call(this);
                fieldName = this._applyWithArgs("FactTypeFieldName", factType);
                return this._or(function() {
                    this._pred(2 == factType.length);
                    resourceName = this._applyWithArgs("GetResourceName", factType[0][1]);
                    return this._applyWithArgs("AddRelationship", resourceName, synForm.slice(1), fieldName);
                }, function() {
                    fkTable = this._applyWithArgs("GetTable", synForm[2][1]);
                    references = this._opt(function() {
                        this._pred(!fkTable.primitive);
                        return this._applyWithArgs("GetReference", fkTable);
                    });
                    this._applyWithArgs("AddRelationship", resourceName, synForm.slice(1), synForm[2][1], references);
                    return this._opt(function() {
                        this._pred(references);
                        linkTable = this._applyWithArgs("GetTable", factType);
                        fromTable = this._applyWithArgs("GetTable", synForm[0][1]);
                        linkRef = this._applyWithArgs("GetReference", linkTable, fieldName);
                        return this._applyWithArgs("AddRelationship", fromTable, synForm.slice(1), references.fieldName, linkRef);
                    });
                });
            });
        },
        AttrTermForm: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, linkResourceName, linkTable, termForm;
            termForm = this.anything();
            linkResourceName = this._applyWithArgs("GetResourceName", factType);
            linkTable = this._applyWithArgs("GetTable", factType);
            return function() {
                var linkVerb;
                this.termForms[factType] = termForm;
                this.synonyms[termForm[1]] = linkResourceName;
                for (var i = 0; i < factType.length; i++) if ("Term" === factType[i][0]) {
                    var hasFactType = [ termForm, [ "Verb", "has", !1 ], factType[i] ], extraFactType = [ termForm, linkVerb || [ "Verb", "has" ], factType[i] ];
                    this.AddFactType(hasFactType, extraFactType);
                    linkVerb && "has" !== linkVerb[1] && this.AddFactType(extraFactType, extraFactType);
                    var termTable = this.GetTable(factType[i][1]);
                    if (termTable.primitive) this.tables[this.GetResourceName(extraFactType)] = "Attribute"; else {
                        this.tables[this.GetResourceName(extraFactType)] = "ForeignKey";
                        var fieldName = this.FactTypeFieldName(extraFactType), references = this.GetReference(linkTable, fieldName);
                        this.AddRelationship(termTable, [ [ "Verb", "has" ], termForm ], termTable.idField, references);
                    }
                } else "Verb" === factType[i][0] && (linkVerb = factType[i]);
            }.call(this);
        },
        AttrNecessity: function(tableID) {
            var $elf = this, _fromIdx = this.input.idx;
            return this._apply("Rule");
        },
        FactType: function() {
            var $elf = this, _fromIdx = this.input.idx, attributes, factType, factTypePart, fieldID, fieldName, fkTable, identifier, identifierTable, linkHasFactType, linkTable, linkVerb, linkVerbFactType, negated, references, resourceName, uniqueFields, verb;
            this._lookahead(function() {
                return factType = this._many1(function() {
                    factTypePart = this.anything();
                    this._lookahead(function() {
                        return attributes = this.anything();
                    });
                    return factTypePart;
                });
            });
            this._applyWithArgs("AddFactType", factType, factType);
            this._or(function() {
                this._pred(this.IsPrimitive(factType[0]));
                return this._many1(function() {
                    factTypePart = this.anything();
                    return this._lookahead(function() {
                        return attributes = this.anything();
                    });
                });
            }, function() {
                resourceName = this._applyWithArgs("GetResourceName", factType);
                return this._or(function() {
                    this._pred(2 == factType.length);
                    this._many1(function() {
                        factTypePart = this.anything();
                        return this._lookahead(function() {
                            return attributes = this.anything();
                        });
                    });
                    identifierTable = this._applyWithArgs("GetTable", factType[0][1]);
                    fieldName = this._applyWithArgs("FactTypeFieldName", factType);
                    this._applyWithArgs("AddTableField", identifierTable, fieldName, "Boolean", !0);
                    delete this.relationships[resourceName];
                    this.tables[resourceName] = "BooleanAttribute";
                    return this._applyWithArgs("AddRelationship", identifierTable, factType.slice(1), fieldName);
                }, function() {
                    linkTable = this._applyWithArgs("CreateTable", resourceName, _(factType).map(1).join(" "));
                    uniqueFields = [];
                    this._many1(function() {
                        return this._or(function() {
                            identifier = this._apply("Identifier");
                            linkHasFactType = [ [ "Term", resourceName ], [ "Verb", "has" ], [ "Term", identifier.name ] ];
                            linkVerbFactType = [ [ "Term", resourceName ], linkVerb, [ "Term", identifier.name ] ];
                            fieldName = this._or(function() {
                                this._pred(linkVerb);
                                return this._applyWithArgs("FactTypeFieldName", linkVerbFactType);
                            }, function() {
                                return this._applyWithArgs("FactTypeFieldName", linkHasFactType);
                            });
                            uniqueFields.push(fieldName);
                            fkTable = this._applyWithArgs("GetTable", identifier.name);
                            references = this._or(function() {
                                this._pred(fkTable.primitive);
                                this._applyWithArgs("AddTableField", linkTable, fieldName, fkTable.primitive, !0);
                                return null;
                            }, function() {
                                references = this._applyWithArgs("GetReference", fkTable);
                                fieldID = this._applyWithArgs("AddTableField", linkTable, fieldName, "ForeignKey", !0, null, references);
                                return references;
                            });
                            this._applyWithArgs("AddRelationship", resourceName, linkHasFactType.slice(2), fieldName, references);
                            return this._opt(function() {
                                this._pred(linkVerb);
                                return this._applyWithArgs("AddRelationship", resourceName, linkVerbFactType.slice(1), fieldName, references);
                            });
                        }, function() {
                            this._form(function() {
                                this._applyWithArgs("exactly", "Verb");
                                verb = this.anything();
                                return negated = this.anything();
                            });
                            return linkVerb = [ "Verb", verb ];
                        });
                    });
                    return linkTable.indexes.push({
                        type: "UNIQUE",
                        fields: uniqueFields
                    });
                });
            });
            return factType;
        },
        Cardinality: function() {
            var $elf = this, _fromIdx = this.input.idx, cardinality;
            this._form(function() {
                (function() {
                    switch (this.anything()) {
                      case "Cardinality":
                        return "Cardinality";

                      case "MaximumCardinality":
                        return "MaximumCardinality";

                      case "MinimumCardinality":
                        return "MinimumCardinality";

                      default:
                        throw this._fail();
                    }
                }).call(this);
                return cardinality = this._apply("Number");
            });
            return cardinality;
        },
        Variable: function() {
            var $elf = this, _fromIdx = this.input.idx, bind, identifier, num, query, selectBody, varNum, whereBody, whereBody2;
            this._form(function() {
                this._applyWithArgs("exactly", "Variable");
                num = this._apply("Number");
                identifier = this._apply("Identifier");
                query = this._or(function() {
                    bind = this.bindAttributes[num];
                    this._pred(bind);
                    selectBody = _.clone(bind.binding);
                    return [ "SelectQuery", [ "Select", [ selectBody ] ] ];
                }, function() {
                    varNum = "." + num;
                    query = [ "SelectQuery", [ "Select", [] ], [ "From", [ this.GetTable(identifier.name).name, identifier.name + varNum ] ] ];
                    this._applyWithArgs("CreateConceptTypesResolver", query, identifier, varNum);
                    return query;
                });
                return this._opt(function() {
                    whereBody = this._apply("RulePart");
                    return this._opt(function() {
                        this._pred(query);
                        return this._applyWithArgs("AddWhereClause", query, whereBody);
                    });
                });
            });
            this._opt(function() {
                whereBody2 = this._apply("RulePart");
                return this._applyWithArgs("AddWhereClause", query, whereBody2);
            });
            return this._or(function() {
                this._pred(!_.some(query, {
                    0: "From"
                }));
                this._opt(function() {
                    whereBody = _.find(query, {
                        0: "Where"
                    });
                    this._pred(whereBody);
                    return selectBody.whereBody = whereBody[1];
                });
                return selectBody;
            }, function() {
                return query;
            });
        },
        RoleBindings: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds;
            binds = [];
            (function() {
                for (var i = 0; i < actualFactType.length; i += 2) {
                    var j = _.findIndex(actualFactType, {
                        3: i
                    });
                    binds[j / 2] = this.RoleBinding(actualFactType[j][1]);
                }
            }).call(this);
            this._apply("end");
            return binds;
        },
        RoleBinding: function(baseTermName) {
            var $elf = this, _fromIdx = this.input.idx, baseBind, binding, conceptTypeResolver, data, identifier, number;
            this._form(function() {
                this._applyWithArgs("exactly", "RoleBinding");
                identifier = this._apply("Identifier");
                return this._or(function() {
                    return number = this._apply("number");
                }, function() {
                    return data = this._apply("Value");
                });
            });
            baseBind = this.bindAttributes[number];
            binding = this._or(function() {
                this._pred(data);
                return data;
            }, function() {
                this._pred(baseBind);
                return baseBind.binding;
            }, function() {
                conceptTypeResolver = this.conceptTypeResolvers[identifier.name + "." + number];
                this._or(function() {
                    return this._pred(!conceptTypeResolver);
                }, function() {
                    return conceptTypeResolver(baseTermName);
                });
                return [ "ReferencedField", baseTermName + "." + number, identifier.name ];
            });
            return {
                identifier: identifier,
                number: number,
                data: data,
                binding: binding
            };
        },
        NativeProperty: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds, negated, operator, primitive, property, verb;
            this._pred(this.IsPrimitive(actualFactType[0]));
            this._pred(this.IsPrimitive(actualFactType[2]));
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            negated = actualFactType[1][2];
            operator = this._or(function() {
                this._pred(negated);
                return "NotEquals";
            }, function() {
                return "Equals";
            });
            this._pred(2 == binds.length);
            primitive = actualFactType[0][1];
            verb = actualFactType[1][1];
            property = actualFactType[2][1];
            this._pred(this.sbvrTypes[primitive] && this.sbvrTypes[primitive].nativeProperties && this.sbvrTypes[primitive].nativeProperties[verb] && this.sbvrTypes[primitive].nativeProperties[verb][property]);
            return [ operator, [ "Boolean", !0 ], [ "Boolean", !0 ] ];
        },
        NativeFactType: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds, comparison, negated, primitive, secondPrimitive, verb;
            this._pred(3 == actualFactType.length);
            this._pred(this.IsPrimitive(actualFactType[0]));
            this._pred(this.IsPrimitive(actualFactType[2]));
            return this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(2 == binds.length);
                primitive = actualFactType[0][1];
                verb = actualFactType[1][1];
                secondPrimitive = actualFactType[2][1];
                this._pred(this.sbvrTypes[primitive] && this.sbvrTypes[primitive].nativeFactTypes && this.sbvrTypes[primitive].nativeFactTypes[secondPrimitive] && this.sbvrTypes[primitive].nativeFactTypes[secondPrimitive][verb]);
                comparison = this.sbvrTypes[primitive].nativeFactTypes[secondPrimitive][verb](binds[0].binding, binds[1].binding);
                negated = actualFactType[1][2];
                return this._or(function() {
                    this._pred(negated);
                    return [ "Not", comparison ];
                }, function() {
                    return comparison;
                });
            }, function() {
                return this._applyWithArgs("foreign", ___NativeFactTypeMatchingFailed___, "die");
            });
        },
        LinkTableAlias: function() {
            var $elf = this, _fromIdx = this.input.idx, bindNumbers, binding, factType, identifierName, identifierType, mapping, partAlias, verb, vocab;
            this._form(function() {
                return bindNumbers = this._many1(function() {
                    binding = this.anything();
                    return binding.number;
                });
            });
            this._form(function() {
                return factType = this._many(function() {
                    this._form(function() {
                        return partAlias = this._or(function() {
                            switch (this.anything()) {
                              case "Verb":
                                verb = this.anything();
                                this.anything();
                                return verb;

                              default:
                                throw this._fail();
                            }
                        }, function() {
                            identifierType = this.anything();
                            identifierName = this.anything();
                            vocab = this.anything();
                            mapping = this._opt(function() {
                                return this.anything();
                            });
                            return identifierName + "." + bindNumbers.shift();
                        });
                    });
                    return partAlias;
                });
            });
            return factType.join("-");
        },
        LinkTable: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds, query, tableAlias;
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            tableAlias = this._applyWithArgs("LinkTableAlias", binds, actualFactType);
            query = [ "SelectQuery", [ "Select", [] ], [ "From", [ this.GetTable(actualFactType).name, tableAlias ] ] ];
            _.each(binds, function(bind, i) {
                var baseIdentifierName = actualFactType[2 * i][1], table = $elf.GetTable(baseIdentifierName);
                table.primitive || $elf.AddWhereClause(query, [ "Equals", [ "ReferencedField", tableAlias, baseIdentifierName ], [ "ReferencedField", bind.binding[1], table.idField ] ]);
            });
            return [ "Exists", query ];
        },
        ForeignKey: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, bindFrom, bindTo, binds, fieldName, tableTo;
            this._pred("ForeignKey" == this.GetTable(actualFactType));
            this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(2 == binds.length);
                bindFrom = binds[0];
                bindTo = binds[1];
                fieldName = this._applyWithArgs("FactTypeFieldName", actualFactType);
                return tableTo = this._applyWithArgs("GetTable", actualFactType[2][1]);
            }, function() {
                return this._applyWithArgs("foreign", ___ForeignKeyMatchingFailed___, "die");
            });
            return [ "Equals", [ "ReferencedField", bindFrom.binding[1], fieldName ], [ "ReferencedField", bindTo.binding[1], tableTo.idField ] ];
        },
        BooleanAttribute: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, attributeName, binds, negated;
            this._pred("BooleanAttribute" == this.GetTable(actualFactType));
            this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(1 == binds.length);
                attributeName = this._applyWithArgs("FactTypeFieldName", actualFactType);
                return negated = actualFactType[1][2];
            }, function() {
                console.error(this.input);
                return this._applyWithArgs("foreign", ___BooleanAttributeMatchingFailed___, "die");
            });
            return [ "Equals", [ "ReferencedField", binds[0].binding[1], attributeName ], [ "Boolean", !negated ] ];
        },
        Attribute: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, bind, bindAttr, bindReal, binds, negated, operator;
            this._pred("Attribute" == this.GetTable(actualFactType));
            this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(2 == binds.length);
                bindReal = binds[0];
                return bindAttr = binds[1];
            }, function() {
                return this._applyWithArgs("foreign", ___AttributeMatchingFailed___, "die");
            });
            negated = actualFactType[1][2];
            operator = this._or(function() {
                this._pred(negated);
                return "NotEquals";
            }, function() {
                return "Equals";
            });
            return this._or(function() {
                bind = this.bindAttributes[bindAttr.number];
                bindAttr.binding = [ "ReferencedField", bindReal.binding[1], bind.binding[2] ];
                this._pred(!_.isEqual(bindAttr.binding, bind.binding));
                return [ operator, bindAttr.binding, bind.binding ];
            }, function() {
                return [ operator, [ "Boolean", !0 ], [ "Boolean", !0 ] ];
            });
        },
        AtomicFormulation: function() {
            var $elf = this, _fromIdx = this.input.idx, actualFactType, factType, whereClause;
            this._form(function() {
                this._applyWithArgs("exactly", "AtomicFormulation");
                this._form(function() {
                    this._applyWithArgs("exactly", "FactType");
                    return factType = this._many1(function() {
                        return this.anything();
                    });
                });
                actualFactType = this._applyWithArgs("MappedFactType", factType);
                return whereClause = this._or(function() {
                    return this._applyWithArgs("NativeProperty", actualFactType);
                }, function() {
                    return this._applyWithArgs("NativeFactType", actualFactType);
                }, function() {
                    return this._applyWithArgs("ForeignKey", actualFactType);
                }, function() {
                    return this._applyWithArgs("BooleanAttribute", actualFactType);
                }, function() {
                    return this._applyWithArgs("Attribute", actualFactType);
                }, function() {
                    return this._applyWithArgs("LinkTable", actualFactType);
                });
            });
            return whereClause;
        },
        AtLeast: function() {
            var $elf = this, _fromIdx = this.input.idx, minCard, variable, where;
            this._form(function() {
                this._applyWithArgs("exactly", "AtLeastNQuantification");
                minCard = this._apply("Cardinality");
                return variable = this._apply("Variable");
            });
            where = this._or(function() {
                this._pred(0 == minCard);
                return [ "Boolean", !0 ];
            }, function() {
                this._pred("SelectQuery" == variable[0] && 0 == variable[1][1].length);
                variable[1][1].push([ "Count", "*" ]);
                return [ "GreaterThanOrEqual", variable, [ "Number", minCard ] ];
            }, function() {
                this._pred(minCard > 1);
                return [ "Boolean", !1 ];
            }, function() {
                return [ "Exists", variable ];
            });
            return this._or(function() {
                this._pred(variable.whereBody);
                return [ "And", variable.whereBody, where ];
            }, function() {
                return where;
            });
        },
        Exactly: function() {
            var $elf = this, _fromIdx = this.input.idx, card, exists, variable, where;
            this._form(function() {
                this._applyWithArgs("exactly", "ExactQuantification");
                card = this._apply("Cardinality");
                return variable = this._apply("Variable");
            });
            where = this._or(function() {
                this._pred("SelectQuery" == variable[0] && 0 == variable[1][1].length);
                variable[1][1].push([ "Count", "*" ]);
                return [ "Equals", variable, [ "Number", card ] ];
            }, function() {
                exists = [ "Exists", variable ];
                return this._or(function() {
                    this._pred(0 == card);
                    return [ "Not", exists ];
                }, function() {
                    this._pred(1 == card);
                    return exists;
                }, function() {
                    return [ "Boolean", !1 ];
                });
            });
            return this._or(function() {
                this._pred(variable.whereBody);
                return [ "And", variable.whereBody, where ];
            }, function() {
                return where;
            });
        },
        Range: function() {
            var $elf = this, _fromIdx = this.input.idx, exists, maxCard, minCard, variable, where;
            this._form(function() {
                this._applyWithArgs("exactly", "NumericalRangeQuantification");
                minCard = this._apply("Cardinality");
                maxCard = this._apply("Cardinality");
                return variable = this._apply("Variable");
            });
            where = this._or(function() {
                this._pred("SelectQuery" == variable[0] && 0 == variable[1][1].length);
                variable[1][1].push([ "Count", "*" ]);
                return [ "Between", variable, [ "Number", minCard ], [ "Number", maxCard ] ];
            }, function() {
                exists = [ "Exists", variable ];
                return this._or(function() {
                    this._pred(0 == minCard);
                    return this._or(function() {
                        this._pred(0 == maxCard);
                        return [ "Not", exists ];
                    }, function() {
                        return [ "Boolean", !0 ];
                    });
                }, function() {
                    this._pred(1 == minCard);
                    return exists;
                }, function() {
                    return [ "Boolean", !1 ];
                });
            });
            return this._or(function() {
                this._pred(variable.whereBody);
                return [ "And", variable.whereBody, where ];
            }, function() {
                return where;
            });
        },
        Disjunction: function() {
            var $elf = this, _fromIdx = this.input.idx, first, rest;
            this._form(function() {
                this._applyWithArgs("exactly", "Disjunction");
                first = this._apply("RulePart");
                return rest = this._many1(function() {
                    return this._apply("RulePart");
                });
            });
            return [ "Or", first ].concat(rest);
        },
        Conjunction: function() {
            var $elf = this, _fromIdx = this.input.idx, first, rest;
            this._form(function() {
                this._applyWithArgs("exactly", "Conjunction");
                first = this._apply("RulePart");
                return rest = this._many1(function() {
                    return this._apply("RulePart");
                });
            });
            return [ "And", first ].concat(rest);
        },
        Exists: function() {
            var $elf = this, _fromIdx = this.input.idx, variable, where;
            this._form(function() {
                this._applyWithArgs("exactly", "ExistentialQuantification");
                return variable = this._apply("Variable");
            });
            where = [ "Exists", variable ];
            return this._or(function() {
                this._pred(variable.whereBody);
                return [ "And", variable.whereBody, where ];
            }, function() {
                return where;
            });
        },
        Negation: function() {
            var $elf = this, _fromIdx = this.input.idx, whereBody;
            this._form(function() {
                this._applyWithArgs("exactly", "LogicalNegation");
                return whereBody = this._apply("RulePart");
            });
            return [ "Not", whereBody ];
        },
        RulePart: function() {
            var $elf = this, _fromIdx = this.input.idx, x;
            return this._or(function() {
                return this._apply("AtomicFormulation");
            }, function() {
                return this._apply("AtLeast");
            }, function() {
                return this._apply("Exactly");
            }, function() {
                return this._apply("Exists");
            }, function() {
                return this._apply("Negation");
            }, function() {
                return this._apply("Range");
            }, function() {
                return this._apply("Disjunction");
            }, function() {
                return this._apply("Conjunction");
            }, function() {
                x = this.anything();
                console.error("Hit unhandled operation:", x);
                return this._pred(!1);
            });
        },
        RuleBody: function() {
            var $elf = this, _fromIdx = this.input.idx, rule;
            this._form(function() {
                (function() {
                    switch (this.anything()) {
                      case "NecessityFormulation":
                        return "NecessityFormulation";

                      case "ObligationFormulation":
                        return "ObligationFormulation";

                      case "PermissibilityFormulation":
                        return "PermissibilityFormulation";

                      case "PossibilityFormulation":
                        return "PossibilityFormulation";

                      default:
                        throw this._fail();
                    }
                }).call(this);
                return rule = this._apply("RulePart");
            });
            return rule;
        },
        ReconstructIdentifier: function(bindIdentifier) {
            var $elf = this, _fromIdx = this.input.idx;
            return [ bindIdentifier.type, bindIdentifier.name, bindIdentifier.vocab ];
        },
        ProcessAtomicFormulations: function() {
            var $elf = this, _fromIdx = this.input.idx;
            this.bindAttributes = [];
            this.bindAttributeDepth = [];
            this.nonPrimitiveExists = !1;
            this._lookahead(function() {
                return this._applyWithArgs("ProcessAtomicFormulationsRecurse", 0, "ProcessAtomicFormulationsAttributes");
            });
            this._lookahead(function() {
                return this._applyWithArgs("ProcessAtomicFormulationsRecurse", 0, "ProcessAtomicFormulationsNonPrimitive");
            });
            return this._lookahead(function() {
                return this._applyWithArgs("ProcessAtomicFormulationsRecurse", 0, "ProcessAtomicFormulationsNativeProperties");
            });
        },
        ProcessAtomicFormulationsRecurse: function(depth, rule) {
            var $elf = this, _fromIdx = this.input.idx, actualFactType, factType, unmappedFactType;
            return this._many(function() {
                return this._or(function() {
                    this._pred(_.isArray(this.input.hd));
                    return this._form(function() {
                        return this._or(function() {
                            switch (this.anything()) {
                              case "AtomicFormulation":
                                this._form(function() {
                                    this._applyWithArgs("exactly", "FactType");
                                    return factType = this._many1(function() {
                                        return this.anything();
                                    });
                                });
                                unmappedFactType = this._applyWithArgs("UnmappedFactType", factType);
                                actualFactType = this._applyWithArgs("MappedFactType", factType);
                                return this._applyWithArgs(rule, depth, unmappedFactType, actualFactType);

                              default:
                                throw this._fail();
                            }
                        }, function() {
                            return this._applyWithArgs("ProcessAtomicFormulationsRecurse", depth + 1, rule);
                        });
                    });
                }, function() {
                    return this.anything();
                });
            });
        },
        ProcessAtomicFormulationsNonPrimitive: function(depth, unmappedFactType, actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds;
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            return function() {
                for (var i = 0; i < binds.length; i++) if (!this.IsPrimitive(this.ReconstructIdentifier(binds[i].identifier))) {
                    this.nonPrimitiveExists = !0;
                    break;
                }
            }.call(this);
        },
        ProcessAtomicFormulationsAttributes: function(depth, unmappedFactType, actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrBinding, attrFieldName, baseAttrFactType, baseBinding, binds, tableAlias;
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            return this._or(function() {
                this._pred(this.attributes.hasOwnProperty(unmappedFactType) && this.attributes[unmappedFactType]);
                baseBinding = _.find(binds, function(bind) {
                    return !$elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier));
                });
                attrBinding = _.find(binds, function(bind) {
                    return $elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier)) && (null == $elf.bindAttributeDepth[bind.number] || $elf.bindAttributeDepth[bind.number] > depth);
                });
                baseAttrFactType = _.cloneDeep(unmappedFactType);
                baseAttrFactType[2][1] = attrBinding.identifier.name;
                attrFieldName = this._applyWithArgs("FactTypeFieldName", baseAttrFactType);
                return function() {
                    this.bindAttributeDepth[attrBinding.number] = depth;
                    return this.bindAttributes[attrBinding.number] = {
                        binding: [ "ReferencedField", baseBinding.binding[1], attrFieldName ]
                    };
                }.call(this);
            }, function() {
                this._pred(_.some(binds, function(bind) {
                    return !$elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier));
                }));
                tableAlias = this._applyWithArgs("LinkTableAlias", binds, actualFactType);
                return function() {
                    for (var i = 0; i < actualFactType.length; i += 2) {
                        var table = this.GetTable(actualFactType[i][1]), bindNumber = binds[i / 2].number;
                        if (table && table.primitive && (null == this.bindAttributeDepth[bindNumber] || this.bindAttributeDepth[bindNumber] > depth)) {
                            this.bindAttributeDepth[bindNumber] = depth;
                            this.bindAttributes[bindNumber] = {
                                binding: [ "ReferencedField", tableAlias, actualFactType[i][1] ]
                            };
                        }
                    }
                }.call(this);
            });
        },
        ProcessAtomicFormulationsNativeProperties: function(depth, unmappedFactType, actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binding, binds, primitive, property, verb;
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            this._pred(_.every(binds, function(bind) {
                return $elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier));
            }));
            this._pred(2 == binds.length);
            primitive = actualFactType[0][1];
            verb = actualFactType[1][1];
            property = actualFactType[2][1];
            this._pred(this.sbvrTypes[primitive] && this.sbvrTypes[primitive].nativeProperties && this.sbvrTypes[primitive].nativeProperties[verb] && this.sbvrTypes[primitive].nativeProperties[verb][property]);
            binding = this.sbvrTypes[primitive].nativeProperties[verb][property](binds[0].binding, binds[1].binding);
            return function() {
                this.bindAttributeDepth[binds[1].number] = depth;
                return this.bindAttributes[binds[1].number] = {
                    binding: binding
                };
            }.call(this);
        },
        Rule: function() {
            var $elf = this, _fromIdx = this.input.idx, ruleBody, ruleText;
            this._apply("ResetRuleState");
            return this._form(function() {
                this._applyWithArgs("exactly", "Rule");
                this._lookahead(function() {
                    return this._apply("ProcessAtomicFormulations");
                });
                ruleBody = this._or(function() {
                    this._pred(this.nonPrimitiveExists);
                    return this._apply("RuleBody");
                }, function() {
                    return this.anything();
                });
                this._form(function() {
                    this._applyWithArgs("exactly", "StructuredEnglish");
                    return ruleText = this.anything();
                });
                return this._opt(function() {
                    this._pred(this.nonPrimitiveExists);
                    return this.rules.push([ "Rule", [ "Body", ruleBody ], [ "StructuredEnglish", ruleText ] ]);
                });
            });
        },
        Process: function() {
            var $elf = this, _fromIdx = this.input.idx, attributes, factType, hasDependants, identifierName, type, vocab;
            this._form(function() {
                this._applyWithArgs("exactly", "Model");
                return this._many1(function() {
                    return this._or(function() {
                        return this._form(function() {
                            return this._or(function() {
                                switch (this.anything()) {
                                  case "Vocabulary":
                                    vocab = this.anything();
                                    return attributes = this.anything();

                                  default:
                                    throw this._fail();
                                }
                            }, function() {
                                type = function() {
                                    switch (this.anything()) {
                                      case "Name":
                                        return "Name";

                                      case "Term":
                                        return "Term";

                                      default:
                                        throw this._fail();
                                    }
                                }.call(this);
                                identifierName = this._apply("IdentifierName");
                                vocab = this.anything();
                                this._applyWithArgs("AddVocabulary", vocab);
                                return this._applyWithArgs("Attributes", [ type, identifierName, vocab ]);
                            }, function() {
                                switch (this.anything()) {
                                  case "FactType":
                                    factType = this._apply("FactType");
                                    return this._applyWithArgs("Attributes", factType);

                                  default:
                                    throw this._fail();
                                }
                            });
                        });
                    }, function() {
                        return this._apply("Rule");
                    });
                });
            });
            hasDependants = {};
            _.each(this.tables, function(table) {
                _.each(table.fields, function(field) {
                    "ForeignKey" !== field.dataType && "ConceptType" !== field.dataType || (hasDependants[field.references.resourceName] = !0);
                });
            });
            return {
                tables: _.omitBy(this.tables, function(table, resourceName) {
                    return _.isString(table) || table.primitive && !hasDependants[resourceName];
                }),
                relationships: this.relationships,
                rules: this.rules,
                synonyms: this.synonyms
            };
        },
        CreateTable: function(resourceName, modelName) {
            var $elf = this, _fromIdx = this.input.idx, table;
            table = {
                fields: [],
                primitive: !1,
                name: null,
                indexes: [],
                idField: null,
                resourceName: resourceName,
                modelName: modelName
            };
            this._applyWithArgs("AddTableField", table, "created at", "Date Time", !0, null, null, "CURRENT_TIMESTAMP");
            return this.tables[resourceName] = table;
        },
        GetReference: function(table, field) {
            var $elf = this, _fromIdx = this.input.idx;
            return {
                resourceName: table.resourceName,
                fieldName: field || table.idField
            };
        }
    });
    LF2AbstractSQL.AddTableField = function(table, fieldName, dataType, required, index, references, defaultValue) {
        void 0 === references && (references = null);
        void 0 === index && (index = null);
        void 0 === defaultValue && (defaultValue = null);
        var fieldID = this.GetTableFieldID(table, fieldName);
        fieldID === !1 && table.fields.push({
            dataType: dataType,
            fieldName: fieldName,
            required: required,
            index: index,
            references: references,
            defaultValue: defaultValue
        });
        return fieldID;
    };
    LF2AbstractSQL.AddRelationship = function(resourceName, factType, fieldName, references, forceHas) {
        var $elf = this;
        if (forceHas !== !0 && "has" === factType[0][1]) {
            var strippedFactType = _.clone(factType);
            strippedFactType.shift();
            this.AddRelationship(resourceName, strippedFactType, fieldName, references);
        }
        _.isObject(resourceName) && (resourceName = resourceName.resourceName);
        null == this.relationships[resourceName] && (this.relationships[resourceName] = {});
        var relationships = this.relationships[resourceName];
        _(factType).flatMap(function(factTypePart) {
            return $elf.ResolveSynonym(factTypePart[1]).split("-");
        }).each(function(partName) {
            null == relationships[partName] && (relationships[partName] = {});
            relationships = relationships[partName];
        });
        var relationReference = [ fieldName ];
        null != references && relationReference.push([ references.resourceName, references.fieldName ]);
        relationships.$ = relationReference;
    };
    LF2AbstractSQL.FactTypeFieldName = function(factType) {
        if (factType.length > 3) throw new Error("Multiple term fact types are unsupported");
        return 2 === factType.length ? factType[1][1] : "has" === factType[1][1] ? factType[2][1] : factType[1][1] + "-" + factType[2][1];
    };
    LF2AbstractSQL.AddWhereClause = function(query, whereBody) {
        if (!_.isEqual(whereBody, [ "Equals", [ "Boolean", !0 ], [ "Boolean", !0 ] ])) if ("Exists" != whereBody[0] || "SelectQuery" != whereBody[1][0] && "InsertQuery" != whereBody[1][0] && "UpdateQuery" != whereBody[1][0] && "UpsertQuery" != whereBody[1][0]) {
            for (var i = 1; i < query.length; i++) if ("Where" == query[i][0]) {
                query[i][1] = [ "And", query[i][1], whereBody ];
                return;
            }
            query.push([ "Where", whereBody ]);
        } else {
            whereBody = whereBody[1].slice(1);
            for (var i = 0; i < whereBody.length; i++) "From" == whereBody[i][0] && query.push(whereBody[i]);
            for (var i = 0; i < whereBody.length; i++) "Where" == whereBody[i][0] && this.AddWhereClause(query, whereBody[i][1]);
        }
    };
    LF2AbstractSQL.CreateConceptTypesResolver = function(query, identifier, varNum) {
        var parentAlias = identifier.name + varNum, concept = this.ReconstructIdentifier(identifier), conceptTypeResolutions, $elf = this;
        if (this.conceptTypeResolvers[parentAlias]) throw new Error('Concept type resolver already added for "' + parentAlias + '"!');
        conceptTypeResolutions = [ identifier.name ];
        this.conceptTypeResolvers[parentAlias] = function(untilConcept) {
            var conceptTable, conceptAlias;
            parentAlias = _.last(conceptTypeResolutions);
            if (parentAlias !== !0 && !_.includes(conceptTypeResolutions, untilConcept)) {
                for (;(concept = this.FollowConceptType(concept)) !== !1; ) {
                    conceptAlias = concept[1] + varNum;
                    conceptTable = this.GetTable(concept[1]);
                    if (conceptTable.primitive !== !1) break;
                    query.push([ "From", [ conceptTable.name, conceptAlias ] ]);
                    this.AddWhereClause(query, [ "Equals", [ "ReferencedField", parentAlias, concept[1] ], [ "ReferencedField", conceptAlias, conceptTable.idField ] ]);
                    parentAlias = conceptAlias;
                    conceptTypeResolutions.push(parentAlias);
                    if (null != untilConcept && !this.IdentifiersEqual(concept, untilConcept)) break;
                }
                concept === !1 && conceptTypeResolutions.push(!0);
            }
        }.bind(this);
    };
    LF2AbstractSQL.initialize = function() {
        this.reset();
        this.sbvrTypes = {};
        this.termForms = {};
    };
    LF2AbstractSQL.reset = function() {
        SBVRCompilerLibs.initialize.call(this);
        this.tables = {};
        this.relationships = {};
        this.synonymousForms = {};
        this.rules = [];
        this.attributes = {};
        this.bindAttributes = [];
        this.bindAttributeDepth = [];
        this.ResetRuleState();
    };
    LF2AbstractSQL.ResetRuleState = function() {
        this.conceptTypeResolvers = {};
    };
    LF2AbstractSQL.addTypes = function(types) {
        _.assign(this.sbvrTypes, types);
    };
});