const { LF2AbstractSQLPrep } = require('./lf-to-abstract-sql-prep');
const { LF2AbstractSQL } = require('./lf-to-abstract-sql');
module.exports = {
	LF2AbstractSQLPrep: LF2AbstractSQLPrep,
	LF2AbstractSQL: LF2AbstractSQL,
	translate: function (lf, types) {
		lf = LF2AbstractSQLPrep.match(lf, 'Process');
		var translator = LF2AbstractSQL.createInstance();
		translator.addTypes(types);
		return translator.match(lf, 'Process');
	},
	createTranslator: function (types) {
		var translator = LF2AbstractSQL.createInstance();
		translator.addTypes(types);
		return function (lf) {
			lf = LF2AbstractSQLPrep.match(lf, 'Process');
			translator.reset();
			return translator.match(lf, 'Process');
		};
	},
};
