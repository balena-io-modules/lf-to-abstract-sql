!function(root, factory) {
    "function" == typeof define && define.amd ? define([ "require", "exports", "ometa-core", "sbvr-parser/sbvr-libs", "lodash" ], factory) : "object" == typeof exports ? factory(require, exports, require("ometa-js").core) : factory(function(moduleName) {
        return root[moduleName];
    }, root, root.OMeta);
}(this, function(require, exports, OMeta) {
    var SBVRLibs = require("sbvr-parser/sbvr-libs").SBVRLibs, _ = require("lodash"), SBVRCompilerLibs = exports.SBVRCompilerLibs = SBVRLibs._extend({});
    SBVRCompilerLibs.initialize = function() {
        SBVRLibs.initialize.call(this);
    };
    SBVRCompilerLibs.TYPE_VOCAB = "Type";
    SBVRCompilerLibs.IsPrimitive = function(term) {
        return term[2] == this.TYPE_VOCAB ? term[1] : (term = this.FollowConceptType(term)) !== !1 && term[2] == this.TYPE_VOCAB ? term[1] : !1;
    };
    SBVRCompilerLibs.IsChild = function(child, parent) {
        do if (this.IdentifiersEqual(child, parent)) return !0; while ((child = this.FollowConceptType(child)) !== !1);
        return !1;
    };
    SBVRCompilerLibs.MappedFactType = function(factType) {
        var traverseInfo = this._traverseFactType(factType), mappedFactType = [];
        if (traverseInfo === !1 || !traverseInfo.hasOwnProperty("__valid")) return !1;
        for (var i = 0; i < traverseInfo.__valid.length; i++) mappedFactType[i] = traverseInfo.__valid[i].slice();
        mappedFactType[1][2] = factType[1][2];
        return mappedFactType;
    };
    SBVRCompilerLibs.UnmappedFactType = function(factType) {
        var mappedFactType = this.MappedFactType(factType);
        if (mappedFactType === !1) return !1;
        for (var i = 0; i < mappedFactType.length; i++) mappedFactType[i] = mappedFactType[i].slice(0, 3);
        return mappedFactType;
    };
    SBVRCompilerLibs.GetResourceName = function(termOrFactType) {
        var i = 0, resource = [];
        if (_.isString(termOrFactType)) return termOrFactType.replace(new RegExp(" ", "g"), "_");
        for (void 0; i < termOrFactType.length; i++) resource.push(termOrFactType[i][1].replace(new RegExp(" ", "g"), "_"));
        return resource.join("-");
    };
    SBVRCompilerLibs.GetTable = function(termNameOrFactType) {
        return this.tables[this.GetResourceName(termNameOrFactType)];
    };
    SBVRCompilerLibs.GetTableID = function(termOrFactType) {
        switch (termOrFactType[0]) {
          case "Term":
          case "Name":
            return termOrFactType[1];

          default:
            return termOrFactType;
        }
    };
    SBVRCompilerLibs.GetTableField = function(table, fieldName) {
        var fieldID = this.GetTableFieldID(table, fieldName);
        return fieldID === !1 ? !1 : table.fields[fieldID];
    };
    SBVRCompilerLibs.GetTableFieldID = function(table, fieldName) {
        for (var tableFields = table.fields, i = 0; i < tableFields.length; i++) if (tableFields[i].fieldName == fieldName) return i;
        return !1;
    };
});