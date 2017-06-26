* Updated to sbvr-parser ^0.1.0 so we can rely on the `has`/`is of` synonymous forms being in the LF.
* Added relationship info from the term form of a fact type to it's component terms
* Added relationship info from the first term of a synonymous form to the fact type table
* Added relationship info from the first term of a fact type to the fact type table
* Removed 'BooleanAttribute'/'Attribute'/'ForeignKey' placeholder tables from the output.
* Added relationship info for synonymous form relationships
* Added a list of synonyms to the result
* Added relationship info for attributes, foreign keys, boolean attributes, and from link tables (fact types) to its component terms.
* Added `modelName` to the table info
* Switched to generating field names as "verb-term" (except when the verb is 'has') so that it is possible to differentiate relationships between terms. eg 'pilot copilots for pilot' and 'pilot trained pilot'
* Changed table names to keep spaces in terms and verbs, but `-` between them, matching fields, eg 'pilot-can fly-plane'
* Removed tables that should not exist from the output.

v0.0.19

* Switched to only adding concept type joins if they're actually needed.
* Added a test for a self-referential fact type and synonymous form.

v0.0.18

* Added support for concept type on term form fact types.
* Added a synonymous form test.

v0.0.17

* Fixed non-primitive concept types.

v0.0.16

* Updated lodash to ^4.0.0

v0.0.15

* Updated ometa-js

v0.0.14

* Added a `created at` field by default that is a `TIMESTAMP` with `DEFAULT CURRENT_TIMESTAMP`.

v0.0.10

* Updated lodash to ^3.0.0

v0.0.9

* Added support for making unique fields of a term form nullable.
