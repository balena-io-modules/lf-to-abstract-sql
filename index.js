(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['lf-to-abstract-sql/lf-to-abstract-sql-prep', 'lf-to-abstract-sql/lf-to-abstract-sql'], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like enviroments that support module.exports,
		// like Node.
		module.exports = factory(
			require('./lf-to-abstract-sql-prep'),
			require('./lf-to-abstract-sql')
		);
	} else {
		// Browser globals
		root.LF2AbstractSQL = factory(LF2AbstractSQLPrep, LF2AbstractSQL);
	}
}(this, function (LF2AbstractSQLPrep, LF2AbstractSQL) {
	LF2AbstractSQLPrep = LF2AbstractSQLPrep.LF2AbstractSQLPrep;
	LF2AbstractSQL = LF2AbstractSQL.LF2AbstractSQL;
	return {
		LF2AbstractSQLPrep: LF2AbstractSQLPrep,
		LF2AbstractSQL: LF2AbstractSQL,
		translate: function(lf, types) {
			lf = LF2AbstractSQLPrep.match(lf, 'Process');
			var translator = LF2AbstractSQL.createInstance();
			translator.addTypes(types);
			return translator.match(lf, 'Process');
		},
		createTranslator: function(types) {
			var translator = LF2AbstractSQL.createInstance();
			translator.addTypes(types);
			return function(lf) {
				lf = LF2AbstractSQLPrep.match(lf, 'Process');
				translator.reset();
				return translator.match(lf, 'Process');
			};
		}
	}
}));