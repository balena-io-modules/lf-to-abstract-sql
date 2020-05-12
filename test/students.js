const test = require('./test')();
const {
	TableSpace,
	term,
	verb,
	factType,
	termForm,
	necessity,
	definitionEnum,
	synonym,
} = require('./sbvr-helper');
const { Table, attribute } = TableSpace();

const person = term('person');
const homoSapiens = term('homo sapiens');
const educationalInstitution = term('educational institution');
const age = term('age');
const schoolYearEnrollment = term('school year enrollment');

describe('students', function () {
	// T: person
	test(Table(person));
	// 	Synonym: homo sapiens
	test(attribute(synonym(homoSapiens)));
	// T: educational institution
	test(Table(educationalInstitution));
	// T: age
	test(Table(age));
	// F: person is enrolled in educational institution
	test(Table(factType(person, verb('is enrolled in'), educationalInstitution)));
	//     Necessity: each person is enrolled in at most one educationalInstitution.
	test(
		attribute(
			necessity(
				'each',
				person,
				verb('is enrolled in'),
				['at most', 'one'],
				educationalInstitution,
			),
		),
	);
	//	Definition: "UniS" or "UWE"
	test(attribute(definitionEnum('UniS', 'UWE')));

	// F: person is enrolled in educational institution for age
	test(
		Table(
			factType(
				person,
				verb('is enrolled in'),
				educationalInstitution,
				verb('for'),
				age,
			),
		),
	);
	// 	Term Form: school year enrollment
	test(attribute(termForm(schoolYearEnrollment)));
	// -- We use 'for' (the verb used in the initial fact type) as a workaround to allow modifying the initial fact type exactly/at most one cardinality
	// Fact type: school year enrollment has age
	test(Table(factType(schoolYearEnrollment, verb('for'), age)));
	//     Necessity: each school year enrollment is for at most one age.
	test(
		attribute(
			necessity(
				'each',
				schoolYearEnrollment,
				verb('for'),
				['at most', 'one'],
				age,
			),
		),
	);
	test({
		property:
			'tables.person-is enrolled in-educational institution-for-age.fields[4].required',
		matches: false,
		se: '-- should have set the age to not required',
	});

	// Vocabulary: other
	test('Vocabulary: other');
	// Term: other term
	test(Table(term('other term')));
});
