!function(root, factory) {
    "function" == typeof define && define.amd ? define([ "require", "exports", "ometa-core", "./sbvr-compiler-libs", "sbvr-parser/lf-optimiser", "lodash" ], factory) : "object" == typeof exports ? factory(require, exports, require("ometa-js").core) : factory(function(moduleName) {
        return root[moduleName];
    }, root, root.OMeta);
}(this, function(require, exports, OMeta) {
    var SBVRCompilerLibs = require("./sbvr-compiler-libs").SBVRCompilerLibs, LFOptimiser = require("sbvr-parser/lf-optimiser").LFOptimiser, _ = require("lodash"), LF2AbstractSQLPrep = exports.LF2AbstractSQLPrep = LFOptimiser._extend({
        AttrConceptType: function(termName) {
            var $elf = this, _fromIdx = this.input.idx, conceptType;
            conceptType = LFOptimiser._superApplyWithArgs(this, "AttrConceptType", termName);
            this._opt(function() {
                this._pred(this.primitives[termName] === !1 && this.primitives[conceptType] !== !1);
                this.primitives[conceptType] = !1;
                return this._apply("SetHelped");
            });
            return conceptType;
        },
        AttrDatabaseAttribute: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrVal, newAttrVal;
            attrVal = this.anything();
            newAttrVal = "Term" == termOrFactType[0] && (!this.attributes.hasOwnProperty(termOrFactType[3]) || this.attributes[termOrFactType[3]] === !0) || "FactType" == termOrFactType[0] && 4 == termOrFactType.length && (!this.attributes.hasOwnProperty(termOrFactType[3]) || this.attributes[termOrFactType[3]] === !0) && this.primitives.hasOwnProperty(termOrFactType[3]) && this.primitives[termOrFactType[3]] !== !1;
            this.attributes[termOrFactType] = newAttrVal;
            this._opt(function() {
                this._pred(newAttrVal != attrVal);
                return this._apply("SetHelped");
            });
            return newAttrVal;
        },
        AttrDatabasePrimitive: function(termOrFactType) {
            var $elf = this, _fromIdx = this.input.idx, attrVal, newAttrVal;
            attrVal = this.anything();
            newAttrVal = attrVal;
            this._opt(function() {
                this._pred(this.primitives.hasOwnProperty(termOrFactType));
                newAttrVal = this.primitives[termOrFactType];
                this._pred(newAttrVal != attrVal);
                return this._apply("SetHelped");
            });
            this.primitives[termOrFactType] = newAttrVal;
            return newAttrVal;
        },
        AttrTermForm: function(factType) {
            var $elf = this, _fromIdx = this.input.idx;
            this.termForms[factType] = !0;
            return this.anything();
        },
        UniversalQuantification: function() {
            var $elf = this, _fromIdx = this.input.idx, v, xs;
            v = this._applyWithArgs("token", "Variable");
            xs = this._many(function() {
                return this._apply("trans");
            });
            this._apply("SetHelped");
            return [ "LogicalNegation", [ "ExistentialQuantification", v, [ "LogicalNegation" ].concat(xs) ] ];
        },
        AtMostNQuantification: function() {
            var $elf = this, _fromIdx = this.input.idx, maxCard, v, xs;
            maxCard = this._applyWithArgs("token", "MaximumCardinality");
            v = this._applyWithArgs("token", "Variable");
            xs = this._many(function() {
                return this._apply("trans");
            });
            this._apply("SetHelped");
            maxCard[1][1]++;
            return [ "LogicalNegation", [ "AtLeastNQuantification", [ "MinimumCardinality", maxCard[1] ], v ].concat(xs) ];
        },
        CardinalityOptimisation2: function(v1) {
            var $elf = this, _fromIdx = this.input.idx, actualFactType, atomicForm, card, factType, required, v2;
            this._pred(3 == v1.length);
            required = this._or(function() {
                this._form(function() {
                    this._applyWithArgs("exactly", "ExactQuantification");
                    card = this._applyWithArgs("token", "Cardinality");
                    this._pred(1 == card[1][1]);
                    v2 = this._applyWithArgs("token", "Variable");
                    return atomicForm = this._applyWithArgs("token", "AtomicFormulation");
                });
                return !0;
            }, function() {
                this._form(function() {
                    this._applyWithArgs("exactly", "AtMostNQuantification");
                    card = this._applyWithArgs("token", "MaximumCardinality");
                    this._pred(1 == card[1][1]);
                    v2 = this._applyWithArgs("token", "Variable");
                    return atomicForm = this._applyWithArgs("token", "AtomicFormulation");
                });
                return !1;
            });
            this._apply("end");
            this._pred(3 == v2.length);
            factType = atomicForm[1];
            this._pred(!this.termForms[factType]);
            this._pred(4 == atomicForm.length && 4 == factType.length);
            actualFactType = this._applyWithArgs("UnmappedFactType", factType.slice(1));
            actualFactType = [ "FactType" ].concat(actualFactType);
            this._or(function() {
                this._pred(this.IdentifiersEqual(v1[2], actualFactType[1]) && this.IdentifiersEqual(v2[2], actualFactType[3]));
                return this.foreignKeys[actualFactType] = required;
            }, function() {
                this._pred(this.IdentifiersEqual(v1[2], actualFactType[3]) && this.IdentifiersEqual(v2[2], actualFactType[1]));
                return this.uniqueKeys[actualFactType] = required;
            });
            return this._apply("SetHelped");
        },
        CardinalityOptimisation: function() {
            var $elf = this, _fromIdx = this.input.idx, v1;
            return this._form(function() {
                switch (this.anything()) {
                  case "LogicalNegation":
                    return this._form(function() {
                        this._applyWithArgs("exactly", "ExistentialQuantification");
                        v1 = this._applyWithArgs("token", "Variable");
                        return this._form(function() {
                            this._applyWithArgs("exactly", "LogicalNegation");
                            return this._applyWithArgs("CardinalityOptimisation2", v1);
                        });
                    });

                  case "UniversalQuantification":
                    v1 = this._applyWithArgs("token", "Variable");
                    return this._applyWithArgs("CardinalityOptimisation2", v1);

                  default:
                    throw this._fail();
                }
            });
        },
        NecessityOptimisation: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._apply("CardinalityOptimisation");
        },
        ObligationOptimisation: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._apply("CardinalityOptimisation");
        },
        Rule: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._or(function() {
                this._form(function() {
                    switch (this.anything()) {
                      case "NecessityFormulation":
                        return this._apply("NecessityOptimisation");

                      case "ObligationFormulation":
                        return this._apply("ObligationOptimisation");

                      default:
                        throw this._fail();
                    }
                });
                this._applyWithArgs("token", "StructuredEnglish");
                return null;
            }, function() {
                return LFOptimiser._superApplyWithArgs(this, "Rule");
            });
        }
    });
    LF2AbstractSQLPrep.initialize = function() {
        _.extend(this, SBVRCompilerLibs);
        LFOptimiser.initialize.call(this);
        this.foreignKeys = {};
        this.uniqueKeys = {};
        this.primitives = {};
        this.attributes = {};
        this.termForms = {};
    };
    LF2AbstractSQLPrep.defaultAttributes = function(termOrFactType, attrsFound, attrs) {
        switch (termOrFactType[0]) {
          case "Name":
          case "Term":
            if (!this.IsPrimitive(termOrFactType) && !attrsFound.hasOwnProperty("DatabaseIDField")) {
                attrs.splice(1, 0, [ "DatabaseIDField", "id" ]);
                this.SetHelped();
            }
            if (!attrsFound.hasOwnProperty("ReferenceScheme")) {
                attrs.splice(1, 0, [ "ReferenceScheme", "id" ]);
                this.SetHelped();
            }
            if (!attrsFound.hasOwnProperty("DatabaseTableName")) {
                attrs.splice(1, 0, [ "DatabaseTableName", termOrFactType[1].replace(new RegExp(" ", "g"), "_") ]);
                this.SetHelped();
            }
            if (!attrsFound.hasOwnProperty("DatabasePrimitive")) {
                this.primitives.hasOwnProperty(termOrFactType) || (this.primitives[termOrFactType] = this.IsPrimitive(termOrFactType));
                attrs.splice(1, 0, [ "DatabasePrimitive", this.primitives[termOrFactType] ]);
                this.SetHelped();
            }
            break;

          case "FactType":
            if (!this.IsPrimitive(termOrFactType[1])) {
                if (!attrsFound.hasOwnProperty("DatabaseIDField")) {
                    attrs.splice(1, 0, [ "DatabaseIDField", "id" ]);
                    this.SetHelped();
                }
                if (!attrsFound.hasOwnProperty("DatabaseTableName")) {
                    for (var tableName = termOrFactType[1][1].replace(new RegExp(" ", "g"), "_"), i = 2; i < termOrFactType.length; i++) tableName += "-" + termOrFactType[i][1].replace(new RegExp(" ", "g"), "_");
                    attrs.splice(1, 0, [ "DatabaseTableName", tableName ]);
                    this.SetHelped();
                }
                if (this.uniqueKeys.hasOwnProperty(termOrFactType)) if (attrsFound.hasOwnProperty("Unique")) {
                    if (attrsFound.Unique != this.uniqueKeys[termOrFactType]) {
                        console.error(attrsFound.Unique, this.uniqueKeys[termOrFactType]);
                        ___MISMATCHED_UNIQUE_KEY___.die();
                    }
                } else {
                    attrs.splice(1, 0, [ "Unique", this.uniqueKeys[termOrFactType] ]);
                    this.SetHelped();
                }
                if (this.foreignKeys.hasOwnProperty(termOrFactType)) {
                    if (!attrsFound.hasOwnProperty("DatabaseAttribute")) {
                        attrs.splice(1, 0, [ "DatabaseAttribute", !1 ]);
                        this.SetHelped();
                    }
                    if (attrsFound.hasOwnProperty("ForeignKey")) {
                        if (attrsFound.ForeignKey != this.foreignKeys[termOrFactType]) {
                            console.error(attrsFound.ForeignKey, this.foreignKeys[termOrFactType]);
                            ___MISMATCHED_FOREIGN_KEY___.die();
                        }
                    } else {
                        attrs.splice(1, 0, [ "ForeignKey", this.foreignKeys[termOrFactType] ]);
                        this.SetHelped();
                    }
                }
                if (3 == termOrFactType.length) {
                    this.primitives.hasOwnProperty(termOrFactType[1]) && this.primitives[termOrFactType[1]] === !1 || this.SetHelped();
                    this.primitives[termOrFactType[1]] = !1;
                } else if (termOrFactType.length > 4) for (var i = 1; i < termOrFactType.length; i += 2) {
                    this.attributes.hasOwnProperty(termOrFactType[i]) && this.attributes[termOrFactType[i]] === !1 || this.SetHelped();
                    this.attributes[termOrFactType[i]] = !1;
                }
            }
        }
        termOrFactType.push(attrs);
    };
});