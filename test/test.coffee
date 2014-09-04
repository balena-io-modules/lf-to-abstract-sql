_ = require 'lodash'
sbvrTypes = require 'sbvr-types'

expect = require('chai').expect
{toSE, getLineType} = require './sbvr-helper'

# This allows us to ignore the "whereBody" property at every level of the result
deleteWhereBodies = (value) ->
	delete value.whereBody
	if _.isArray(value)
		_.forEach(value, deleteWhereBodies)

module.exports = (builtInVocab = false) ->
	SBVRParser = require('sbvr-parser').SBVRParser.createInstance()
	SBVRParser.enableReusingMemoizations(SBVRParser._sideEffectingRules)

	LF2AbstractSQL = require '../index'
	LF2AbstractSQLTranslator = LF2AbstractSQL.createTranslator(sbvrTypes)

	if builtInVocab
		SBVRParser.AddBuiltInVocab(builtInVocab)

	seSoFar = ''
	previousResult = do ->
		lf = SBVRParser.matchAll(seSoFar, 'Process')
		LF2AbstractSQLTranslator(lf, 'Process')

	runExpectation = (describe, input, expectation) ->
		if _.isArray(input)
			input = getLineType(input) + ': ' + toSE(input)
		else if _.isObject(input)
			{matches, property, ruleSQL, se: input} = input

		it input, ->
			try
				SBVRParser.reset()
				lf = SBVRParser.matchAll(seSoFar + input, 'Process')
				result = LF2AbstractSQLTranslator(lf, 'Process')

				seSoFar += input + '\n'
				if property
					expect(result).to.have.deep.property(property).to.deep.equal(matches)
				else if ruleSQL
					lastRule = result.rules[result.rules.length-1]
					deleteWhereBodies(lastRule)
					expect(lastRule).to.deep.equal(ruleSQL)
				else
					expect(result).to.deep.equal(previousResult)
				previousResult = result
				expectation?(result)
			catch e
				if expectation?
					expectation(e)
				else
					throw e
	
	ret = runExpectation.bind(null, describe)
	ret.skip = runExpectation.bind(null, describe.skip)
	ret.only = runExpectation.bind(null, describe.only)
	return ret
