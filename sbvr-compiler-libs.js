var OMeta = require("ometa-js/lib/ometajs/core"), SBVRLibs = require("@resin/sbvr-parser/sbvr-libs").SBVRLibs, _ = require("lodash"), SBVRCompilerLibs = exports.SBVRCompilerLibs = SBVRLibs._extend({
    ResolveSynonym: function(name) {
        var $elf = this, _fromIdx = this.input.idx;
        return this._or(function() {
            this._pred(this.synonyms[name]);
            return this.synonyms[name];
        }, function() {
            return name;
        });
    }
});

SBVRCompilerLibs.initialize = function() {
    SBVRLibs.initialize.call(this);
    this.synonyms = {};
};

SBVRCompilerLibs.TYPE_VOCAB = "Type";

SBVRCompilerLibs.IsPrimitive = function(term) {
    return term[2] == this.TYPE_VOCAB ? term[1] : !1 !== (term = this.FollowConceptType(term)) && term[2] == this.TYPE_VOCAB && term[1];
};

SBVRCompilerLibs.IsChild = function(child, parent) {
    do {
        if (this.IdentifiersEqual(child, parent)) return !0;
    } while (!1 !== (child = this.FollowConceptType(child)));
    return !1;
};

SBVRCompilerLibs.MappedFactType = function(factType) {
    var traverseInfo = this._traverseFactType(factType), mappedFactType = [];
    if (!1 === traverseInfo || !traverseInfo.hasOwnProperty("__valid")) return !1;
    for (var i = 0; i < traverseInfo.__valid.length; i++) mappedFactType[i] = traverseInfo.__valid[i].slice();
    mappedFactType[1][2] = factType[1][2];
    return mappedFactType;
};

SBVRCompilerLibs.UnmappedFactType = function(factType) {
    var mappedFactType = this.MappedFactType(factType);
    if (!1 === mappedFactType) return !1;
    for (var i = 0; i < mappedFactType.length; i++) mappedFactType[i] = mappedFactType[i].slice(0, 3);
    return mappedFactType;
};

SBVRCompilerLibs.GetResourceName = function(termOrFactType) {
    var i = 0, resource = [];
    if (_.isString(termOrFactType)) return this.ResolveSynonym(termOrFactType);
    for (void 0; i < termOrFactType.length; i++) resource.push(this.ResolveSynonym(termOrFactType[i][1]));
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
    return !1 !== fieldID && table.fields[fieldID];
};

SBVRCompilerLibs.GetTableFieldID = function(table, fieldName) {
    for (var tableFields = table.fields, i = 0; i < tableFields.length; i++) if (tableFields[i].fieldName == fieldName) return i;
    return !1;
};