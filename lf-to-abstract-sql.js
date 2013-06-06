(function(root, factory) {
    "function" == typeof define && define.amd ? define([ "require", "exports", "ometa-core", "./sbvr-compiler-libs", "lodash" ], factory) : "object" == typeof exports ? factory(require, exports, require("ometa-js").core) : factory(function(moduleName) {
        return root[moduleName];
    }, root, root.OMeta);
})(this, function(require, exports, OMeta) {
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
                return text = this._apply("anything");
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
                    switch (this._apply("anything")) {
                      case "Name":
                        return "Name";

                      case "Term":
                        return "Term";

                      default:
                        throw this._fail();
                    }
                }.call(this);
                name = this._apply("anything");
                vocab = this._apply("anything");
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
            identifierName = this._apply("anything");
            resourceName = this._applyWithArgs("GetResourceName", identifierName);
            this._or(function() {
                return this._pred(!this.tables.hasOwnProperty(resourceName));
            }, function() {
                console.error("We already have an identifier with a name of: " + identifierName);
                return this._pred(!1);
            });
            this.identifiers[identifierName] = identifierName;
            this.tables[resourceName] = {
                fields: [],
                primitive: !1,
                name: null,
                idField: null
            };
            return identifierName;
        },
        Attributes: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, attributeName, attributeValue;
            return this._or(function() {
                return this._apply("end");
            }, function() {
                return this._form(function() {
                    this._applyWithArgs("exactly", "Attributes");
                    return this._many(function() {
                        return this._form(function() {
                            attributeName = this._apply("anything");
                            return attributeValue = this._applyWithArgs("ApplyFirstExisting", [ "Attr" + attributeName, "DefaultAttr" ], [ termOrFactType ]);
                        });
                    });
                });
            });
        },
        DefaultAttr: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, anything;
            anything = this._apply("anything");
            return console.log("Default", termOrFactType, anything);
        },
        AttrConceptType: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, conceptTable, conceptType, dataType, fieldID, identifierTable, primitive, term, vocab;
            term = this._form(function() {
                this._applyWithArgs("exactly", "Term");
                conceptType = this._apply("anything");
                return vocab = this._apply("anything");
            });
            this.vocabularies[termOrFactType[2]].ConceptTypes[termOrFactType] = term;
            primitive = this._applyWithArgs("IsPrimitive", term);
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
                return dataType = "ConceptType";
            });
            return this._applyWithArgs("AddTableField", identifierTable, conceptType, dataType, !0, null, conceptTable.idField);
        },
        AttrDatabaseIDField: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, fieldID, idField, table, tableID;
            idField = this._apply("anything");
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
            referenceScheme = this._apply("anything");
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
            var $elf = this, _fromIdx = this.input.idx, table, tableID, tableName;
            tableName = this._apply("anything");
            tableID = this._applyWithArgs("GetTableID", termOrFactType);
            table = this._applyWithArgs("GetTable", tableID);
            return this._or(function() {
                return this._pred(_.isString(table));
            }, function() {
                return table.name = tableName;
            });
        },
        AttrDatabasePrimitive: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrVal, tableID;
            attrVal = this._apply("anything");
            tableID = this._applyWithArgs("GetTableID", termOrFactType);
            return this.GetTable(tableID).primitive = attrVal;
        },
        AttrDatabaseAttribute: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, attrVal, attributeName, attributeTable, baseTable, fieldID;
            attrVal = this._apply("anything");
            return this._opt(function() {
                this._pred(attrVal);
                this.attributes[factType] = attrVal;
                this.tables[this.GetResourceName(factType)] = "Attribute";
                baseTable = this._applyWithArgs("GetTable", factType[0][1]);
                attributeName = factType[2][1];
                attributeTable = this._applyWithArgs("GetTable", attributeName);
                fieldID = this._applyWithArgs("GetTableFieldID", baseTable, attributeName);
                return baseTable.fields[fieldID].dataType = attributeTable.primitive;
            });
        },
        AttrForeignKey: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, baseTable, fieldID, fkName, fkTable, required;
            required = this._apply("anything");
            baseTable = this._applyWithArgs("GetTable", factType[0][1]);
            fkName = factType[2][1];
            fkTable = this._applyWithArgs("GetTable", fkName);
            this._opt(function() {
                this._pred(baseTable.idField == fkName);
                fieldID = this._applyWithArgs("GetTableFieldID", baseTable, fkName);
                this._pred(fieldID !== !1);
                return baseTable.fields.splice(fieldID, 1);
            });
            this._applyWithArgs("AddTableField", baseTable, fkName, "ForeignKey", required, null, {
                tableName: fkTable.name,
                fieldName: fkTable.idField
            });
            return this.tables[this.GetResourceName(factType)] = "ForeignKey";
        },
        AttrUnique: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, baseTable, fieldID, required, uniqueField;
            required = this._apply("anything");
            baseTable = this._applyWithArgs("GetTable", factType);
            this._opt(function() {
                this._pred("Attribute" === baseTable || "ForeignKey" === baseTable);
                return baseTable = this._applyWithArgs("GetTable", factType[0][1]);
            });
            uniqueField = factType[2][1];
            fieldID = this._applyWithArgs("GetTableFieldID", baseTable, uniqueField);
            this._pred(fieldID !== !1);
            return baseTable.fields[fieldID].index = "UNIQUE";
        },
        AttrSynonymousForm: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, synForm;
            synForm = this._apply("anything");
            return this._applyWithArgs("AddFactType", synForm, factType);
        },
        AttrTermForm: function(factType) {
            var $elf = this, _fromIdx = this.input.idx, term;
            term = this._apply("anything");
            return function() {
                this.identifiers[term[1]] = factType;
                this.tables[this.GetResourceName(term[1])] = this.GetTable(factType);
                for (var i = 0; factType.length > i; i++) if ("Term" === factType[i][0]) {
                    var extraFactType = [ term, [ "Verb", "has", !1 ], factType[i] ];
                    this.AddFactType(extraFactType, extraFactType);
                    this.tables[this.GetResourceName(extraFactType)] = this.GetTable(factType[i][1]).primitive ? "Attribute" : "ForeignKey";
                }
            }.call(this);
        },
        AttrNecessity: function(tableID) {
            var $elf = this, _fromIdx = this.input.idx;
            return this._apply("Rule");
        },
        FactType: function() {
            var $elf = this, _fromIdx = this.input.idx, attributes, factType, factTypePart, fkTable, identifier, identifierTable, linkTable, negated, resourceName, verb;
            this._lookahead(function() {
                return factType = this._many1(function() {
                    factTypePart = this._apply("anything");
                    this._lookahead(function() {
                        return attributes = this._apply("anything");
                    });
                    return factTypePart;
                });
            });
            this._applyWithArgs("AddFactType", factType, factType);
            this._or(function() {
                this._pred(this.IsPrimitive(factType[0]));
                return this._many1(function() {
                    factTypePart = this._apply("anything");
                    return this._lookahead(function() {
                        return attributes = this._apply("anything");
                    });
                });
            }, function() {
                resourceName = this._applyWithArgs("GetResourceName", factType);
                return this._or(function() {
                    this._pred(2 == factType.length);
                    this._many1(function() {
                        factTypePart = this._apply("anything");
                        return this._lookahead(function() {
                            return attributes = this._apply("anything");
                        });
                    });
                    identifierTable = this._applyWithArgs("GetTable", factType[0][1]);
                    this._applyWithArgs("AddTableField", identifierTable, factType[1][1], "Boolean", !0);
                    return this.tables[resourceName] = "BooleanAttribute";
                }, function() {
                    linkTable = this.tables[resourceName] = {
                        fields: [],
                        primitive: !1,
                        name: null
                    };
                    return this._many1(function() {
                        return this._or(function() {
                            identifier = this._apply("Identifier");
                            fkTable = this._applyWithArgs("GetTable", identifier.name);
                            return this._or(function() {
                                this._pred(fkTable.primitive);
                                return this._applyWithArgs("AddTableField", linkTable, identifier.name + identifier.num, fkTable.primitive, !0);
                            }, function() {
                                return this._applyWithArgs("AddTableField", linkTable, identifier.name + identifier.num, "ForeignKey", !0, null, {
                                    tableName: fkTable.name,
                                    fieldName: fkTable.idField
                                });
                            });
                        }, function() {
                            return this._form(function() {
                                this._applyWithArgs("exactly", "Verb");
                                verb = this._apply("anything");
                                return negated = this._apply("anything");
                            });
                        });
                    });
                });
            });
            return factType;
        },
        Cardinality: function() {
            var $elf = this, _fromIdx = this.input.idx, cardinality;
            this._form(function() {
                (function() {
                    switch (this._apply("anything")) {
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
                    this._applyWithArgs("ResolveConceptTypes", query, identifier, varNum);
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
                this._pred(!_.any(query, {
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
                for (var i = 0; actualFactType.length > i; i += 2) {
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
            var $elf = this, _fromIdx = this.input.idx, baseBind, binding, data, identifier, number;
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
            var $elf = this, _fromIdx = this.input.idx, binds, primitive, property, verb;
            this._pred(this.IsPrimitive(actualFactType[0]));
            this._pred(this.IsPrimitive(actualFactType[2]));
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            this._pred(2 == binds.length);
            primitive = actualFactType[0][1];
            verb = actualFactType[1][1];
            property = actualFactType[2][1];
            this._pred(this.sbvrTypes[primitive] && this.sbvrTypes[primitive].nativeProperties && this.sbvrTypes[primitive].nativeProperties[verb] && this.sbvrTypes[primitive].nativeProperties[verb][property]);
            return [ "Equals", [ "Boolean", !0 ], [ "Boolean", !0 ] ];
        },
        NativeFactType: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds, primitive, secondPrimitive, verb;
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
                return this.sbvrTypes[primitive].nativeFactTypes[secondPrimitive][verb](binds[0].binding, binds[1].binding);
            }, function() {
                return this._applyWithArgs("foreign", ___NativeFactTypeMatchingFailed___, "die");
            });
        },
        LinkTableAlias: function() {
            var $elf = this, _fromIdx = this.input.idx, bindNumbers, binding, factType, identifierName, identifierType, mapping, partAlias, verb, vocab;
            this._form(function() {
                return bindNumbers = this._many1(function() {
                    binding = this._apply("anything");
                    return binding.number;
                });
            });
            this._form(function() {
                return factType = this._many(function() {
                    this._form(function() {
                        return partAlias = this._or(function() {
                            return function() {
                                switch (this._apply("anything")) {
                                  case "Verb":
                                    return function() {
                                        verb = this._apply("anything");
                                        this._apply("anything");
                                        return verb;
                                    }.call(this);

                                  default:
                                    throw this._fail();
                                }
                            }.call(this);
                        }, function() {
                            identifierType = this._apply("anything");
                            identifierName = this._apply("anything");
                            vocab = this._apply("anything");
                            mapping = this._opt(function() {
                                return this._apply("anything");
                            });
                            return identifierName + "." + bindNumbers.pop();
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
                var baseIdentifierName = actualFactType[2 * i][1], table = this.GetTable(baseIdentifierName);
                table.primitive || this.AddWhereClause(query, [ "Equals", [ "ReferencedField", tableAlias, baseIdentifierName ], [ "ReferencedField", bind.binding[1], table.idField ] ]);
            }, this);
            return [ "Exists", query ];
        },
        ForeignKey: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, baseToIdentifier, bindFrom, bindTo, binds, tableTo;
            this._pred("ForeignKey" == this.GetTable(actualFactType));
            this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(2 == binds.length);
                bindFrom = binds[0];
                bindTo = binds[1];
                baseToIdentifier = actualFactType[2];
                return tableTo = this._applyWithArgs("GetTable", baseToIdentifier[1]);
            }, function() {
                return this._applyWithArgs("foreign", ___ForeignKeyMatchingFailed___, "die");
            });
            return [ "Equals", [ "ReferencedField", bindFrom.binding[1], baseToIdentifier[1] ], [ "ReferencedField", bindTo.binding[1], tableTo.idField ] ];
        },
        BooleanAttribute: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, attributeName, binds, negated;
            this._pred("BooleanAttribute" == this.GetTable(actualFactType));
            this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(1 == binds.length);
                attributeName = actualFactType[1][1];
                return negated = actualFactType[1][2];
            }, function() {
                console.error(this.input);
                return this._applyWithArgs("foreign", ___BooleanAttributeMatchingFailed___, "die");
            });
            return [ "Equals", [ "ReferencedField", binds[0].binding[1], attributeName ], [ "Boolean", !negated ] ];
        },
        Attribute: function(actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, bind, bindAttr, bindReal, binds;
            this._pred("Attribute" == this.GetTable(actualFactType));
            this._or(function() {
                binds = this._applyWithArgs("RoleBindings", actualFactType);
                this._pred(2 == binds.length);
                bindReal = binds[0];
                return bindAttr = binds[1];
            }, function() {
                return this._applyWithArgs("foreign", ___AttributeMatchingFailed___, "die");
            });
            return this._or(function() {
                bind = this.bindAttributes[bindAttr.number];
                bindAttr.binding = [ "ReferencedField", bindReal.binding[1], bind.binding[2] ];
                this._pred(!_.isEqual(bindAttr.binding, bind.binding));
                return [ "Equals", bindAttr.binding, bind.binding ];
            }, function() {
                return [ "Equals", [ "Boolean", !0 ], [ "Boolean", !0 ] ];
            });
        },
        AtomicFormulation: function() {
            var $elf = this, _fromIdx = this.input.idx, actualFactType, factType, whereClause;
            this._form(function() {
                this._applyWithArgs("exactly", "AtomicFormulation");
                this._form(function() {
                    this._applyWithArgs("exactly", "FactType");
                    return factType = this._many1(function() {
                        return this._apply("anything");
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
            var $elf = this, _fromIdx = this.input.idx, whereBody, x;
            whereBody = this._many1(function() {
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
                    x = this._apply("anything");
                    console.error("Hit unhandled operation:", x);
                    return this._pred(!1);
                });
            });
            return this._or(function() {
                this._pred(1 == whereBody.length);
                return whereBody[0];
            }, function() {
                return [ "And" ].concat(whereBody);
            });
        },
        RuleBody: function() {
            var $elf = this, _fromIdx = this.input.idx, rule;
            this._form(function() {
                (function() {
                    switch (this._apply("anything")) {
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
                            return function() {
                                switch (this._apply("anything")) {
                                  case "AtomicFormulation":
                                    return function() {
                                        this._form(function() {
                                            this._applyWithArgs("exactly", "FactType");
                                            return factType = this._many1(function() {
                                                return this._apply("anything");
                                            });
                                        });
                                        unmappedFactType = this._applyWithArgs("UnmappedFactType", factType);
                                        actualFactType = this._applyWithArgs("MappedFactType", factType);
                                        return this._applyWithArgs(rule, depth, unmappedFactType, actualFactType);
                                    }.call(this);

                                  default:
                                    throw this._fail();
                                }
                            }.call(this);
                        }, function() {
                            return this._applyWithArgs("ProcessAtomicFormulationsRecurse", depth + 1, rule);
                        });
                    });
                }, function() {
                    return this._apply("anything");
                });
            });
        },
        ProcessAtomicFormulationsNonPrimitive: function(depth, unmappedFactType, actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, binds;
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            return function() {
                for (var i = 0; binds.length > i; i++) if (!this.IsPrimitive(this.ReconstructIdentifier(binds[i].identifier))) {
                    this.nonPrimitiveExists = !0;
                    break;
                }
            }.call(this);
        },
        ProcessAtomicFormulationsAttributes: function(depth, unmappedFactType, actualFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrBinding, baseBinding, binds, tableAlias;
            binds = this._applyWithArgs("RoleBindings", actualFactType);
            return this._or(function() {
                this._pred(this.attributes.hasOwnProperty(unmappedFactType) && this.attributes[unmappedFactType]);
                baseBinding = _.find(binds, function(bind) {
                    return !$elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier));
                });
                attrBinding = _.find(binds, function(bind) {
                    return $elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier)) && (null == $elf.bindAttributeDepth[bind.number] || $elf.bindAttributeDepth[bind.number] > depth);
                });
                return function() {
                    this.bindAttributeDepth[attrBinding.number] = depth;
                    return this.bindAttributes[attrBinding.number] = {
                        binding: [ "ReferencedField", baseBinding.binding[1], attrBinding.identifier.name ]
                    };
                }.call(this);
            }, function() {
                this._pred(_.any(binds, function(bind) {
                    return !$elf.IsPrimitive($elf.ReconstructIdentifier(bind.identifier));
                }));
                tableAlias = this._applyWithArgs("LinkTableAlias", binds, actualFactType);
                return function() {
                    for (var i = 0; actualFactType.length > i; i += 2) {
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
            this._pred(_.all(binds, function(bind) {
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
            return this._form(function() {
                this._applyWithArgs("exactly", "Rule");
                this._lookahead(function() {
                    return this._apply("ProcessAtomicFormulations");
                });
                ruleBody = this._or(function() {
                    this._pred(this.nonPrimitiveExists);
                    return this._apply("RuleBody");
                }, function() {
                    return this._apply("anything");
                });
                this._form(function() {
                    this._applyWithArgs("exactly", "StructuredEnglish");
                    return ruleText = this._apply("anything");
                });
                return this._or(function() {
                    this._pred(this.nonPrimitiveExists);
                    return this.rules.push([ "Rule", [ "StructuredEnglish", ruleText ], [ "Body", ruleBody ] ]);
                }, function() {
                    return console.warn("Ignoring rule with only primitives: ", ruleText, ruleBody);
                });
            });
        },
        Process: function() {
            var $elf = this, _fromIdx = this.input.idx, attributes, factType, identifierName, tables, type, vocab;
            this._form(function() {
                this._applyWithArgs("exactly", "Model");
                return this._many1(function() {
                    return this._or(function() {
                        return this._form(function() {
                            return this._or(function() {
                                return function() {
                                    switch (this._apply("anything")) {
                                      case "Vocabulary":
                                        return function() {
                                            vocab = this._apply("anything");
                                            return attributes = this._apply("anything");
                                        }.call(this);

                                      default:
                                        throw this._fail();
                                    }
                                }.call(this);
                            }, function() {
                                type = function() {
                                    switch (this._apply("anything")) {
                                      case "Name":
                                        return "Name";

                                      case "Term":
                                        return "Term";

                                      default:
                                        throw this._fail();
                                    }
                                }.call(this);
                                identifierName = this._apply("IdentifierName");
                                vocab = this._apply("anything");
                                this._applyWithArgs("AddVocabulary", vocab);
                                return this._applyWithArgs("Attributes", [ type, identifierName, vocab ]);
                            }, function() {
                                return function() {
                                    switch (this._apply("anything")) {
                                      case "FactType":
                                        return function() {
                                            factType = this._apply("FactType");
                                            return this._applyWithArgs("Attributes", factType);
                                        }.call(this);

                                      default:
                                        throw this._fail();
                                    }
                                }.call(this);
                            });
                        });
                    }, function() {
                        return this._apply("Rule");
                    });
                });
            });
            tables = {};
            return {
                tables: this.tables,
                rules: this.rules
            };
        }
    });
    LF2AbstractSQL.AddTableField = function(table, fieldName, dataType, required, index, references) {
        var fieldID = this.GetTableFieldID(table, fieldName);
        fieldID === !1 && table.fields.push({
            dataType: dataType,
            fieldName: fieldName,
            required: required,
            index: index,
            references: references
        });
        return fieldID;
    };
    LF2AbstractSQL.AddWhereClause = function(query, whereBody) {
        if (_.isEqual(whereBody, [ "Equals", [ "Boolean", !0 ], [ "Boolean", !0 ] ])) return void 0;
        if ("Exists" != whereBody[0] || "SelectQuery" != whereBody[1][0] && "InsertQuery" != whereBody[1][0] && "UpdateQuery" != whereBody[1][0] && "UpsertQuery" != whereBody[1][0]) {
            for (var i = 1; query.length > i; i++) if ("Where" == query[i][0]) {
                query[i][1] = [ "And", query[i][1], whereBody ];
                return void 0;
            }
            query.push([ "Where", whereBody ]);
        } else {
            whereBody = whereBody[1].slice(1);
            for (var i = 0; whereBody.length > i; i++) "From" == whereBody[i][0] && query.push(whereBody[i]);
            for (var i = 0; whereBody.length > i; i++) "Where" == whereBody[i][0] && this.AddWhereClause(query, whereBody[i][1]);
        }
    };
    LF2AbstractSQL.ResolveConceptTypes = function(query, identifier, varNum, untilConcept) {
        for (var conceptAlias, parentAlias = identifier.name + varNum, concept = this.ReconstructIdentifier(identifier), conceptTable; (null == untilConcept || !this.IdentifiersEqual(concept, untilConcept)) && (concept = this.FollowConceptType(concept)) !== !1; ) {
            conceptAlias = concept[1] + varNum;
            conceptTable = this.GetTable(concept[1]);
            if (conceptTable.primitive !== !1) break;
            query.push([ "From", [ conceptTable.name, conceptAlias ] ]);
            this.AddWhereClause(query, [ "Equals", [ "ReferencedField", parentAlias, concept[1] ], [ "ReferencedField", conceptAlias, conceptTable.idField ] ]);
            parentAlias = conceptAlias;
        }
    };
    LF2AbstractSQL.initialize = function() {
        this.reset();
        this.sbvrTypes = {};
    };
    LF2AbstractSQL.reset = function() {
        SBVRCompilerLibs.initialize.call(this);
        this.tables = {};
        this.identifiers = {};
        this.rules = [];
        this.attributes = {};
        this.bindAttributes = [];
        this.bindAttributeDepth = [];
    };
    LF2AbstractSQL.addTypes = function(types) {
        _.extend(this.sbvrTypes, types);
    };
});