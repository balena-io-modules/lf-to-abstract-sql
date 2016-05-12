typeVocab = require('fs').readFileSync(require.resolve('@resin/sbvr-types/Type.sbvr'))
test = require('./test')(typeVocab)
{ TableSpace, term, verb, factType, conceptType, termForm, referenceScheme, necessity, rule, conceptType, note, definitionEnum } = require './sbvr-helper'
{ Table, attribute, rule } = TableSpace()

shortTextType = term 'Short Text', 'Type'
textType = term 'Text', 'Type'
integerType = term 'Integer', 'Type'
realType = term 'Real', 'Type'
dateType = term 'Date', 'Type'
lengthType = term 'Length', 'Type'

has = verb 'has'
isOf = verb 'is of'
name = term 'name'
locale = term 'locale'
language = term 'language'
region = term 'region'
country = term 'country'
latitude = term 'latitude'
longitude = term 'longitude'
city = term 'city'
media = term 'media'
tourType = term 'tour type'
mediaType = term 'media type'
comment = term 'comment'
durationInDays = term 'duration in days'
plan = term 'plan'
tour = term 'tour'
path = term 'path'
title = term 'title'
description = term 'description'
keyword = term 'keyword'
departureDate = term 'departure date'
availability = term 'availability'
singlePrice = term 'single price'
doublePrice = term 'double price'
airFee = term 'air fee'
application = term 'application'
itinerary = term 'itinerary'
overnights = term 'overnights'
order = term 'order'
dayNumber = term 'day number'
location = term 'location'
story = term 'story'
recommendation = term 'recommendation'
link = term 'link'
banner = term 'banner'
requirement = term 'requirement'
firstName = term 'first name'
lastName = term 'last name'
email = term 'email'
subscriber = term 'subscriber'
recipientGroup = term 'recipient group'
service = term 'service'
option = term 'option'
site = term 'site'
value = term 'value'
page = term 'page'
body = term 'body'
url = term 'url'
linkCategory = term 'link category'
width = term 'width'
height = term 'height'

regionTranslation = term 'region translation'
countryTranslation = term 'country translation'
cityTranslation = term 'city translation'
mediaTranslation = term 'media translation'
tourTypeTranslation = term 'tour type translation'
tourTranslation = term 'tour translation'
applicationTranslation = term 'application translation'
storyTranslation = term 'story translation'
requirementTranslation = term 'requirement translation'
recommendationTranslation = term 'recommendation translation'
linkTranslation = term 'link translation'
bannerTranslation = term 'banner translation'
serviceInclusion = term 'service inclusion'
serviceExclusion = term 'service exclusion'
siteOption = term 'site option'
pageTranslation = term 'page translation'

describe 'vforvacation', ->
	# Term:	   name
	test Table name
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Term:      locale
	test Table locale
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# 	Necessity: each locale has a Length (Type) that is equal to 2.
	test attribute necessity 'each', locale, has, 'a', [lengthType, verb('is equal to'), 2]

	# Term:      language
	test Table language
	# Fact type: language has name
	test Table factType language, has, name
	# 	Necessity: each language has exactly one name.
	test attribute necessity 'each', language, has, ['exactly', 'one'], name
	# 	Necessity: each name is of exactly one language.
	test attribute necessity 'each', name, isOf, ['exactly', 'one'], language
	# Fact type: language has locale
	test Table factType language, has, locale
	# 	Necessity: each language has exactly one locale.
	test attribute necessity 'each', language, has, ['exactly', 'one'], locale
	# 	Necessity: each locale is of exactly one language.
	test attribute necessity 'each', locale, isOf, ['exactly', 'one'], language

	# Term:      region
	test Table region
	# Fact type: region is available in language
	test Table factType region, verb('is available in'), language
	# 	Term Form: region translation
	test attribute termForm regionTranslation

	# Fact type: region translation has name
	test Table factType regionTranslation, has, name
	#     Necessity: each region translation has exactly one name.
	test attribute necessity 'each', regionTranslation, has, ['exactly', 'one'], name

	# Term:      country
	test Table country
	# Fact type: country is available in language
	test Table factType country, verb('is available in'), language
	# 	Term Form: country translation
	test attribute termForm countryTranslation
	# Fact type: country is of region
	test Table factType country, isOf, region
	# 	Necessity: each country is of exactly one region.
	test attribute necessity 'each', country, isOf, ['exactly', 'one'], region

	# Fact type: country translation has name
	test Table factType countryTranslation, has, name
	# 	Necessity: each country translation has exactly one name.
	test attribute necessity 'each', countryTranslation, has, ['exactly', 'one'], name

	# Term:      latitude
	test Table latitude
	# 	Concept Type: Real (Type)
	test attribute conceptType realType

	# Term:      longitude
	test Table longitude
	# 	Concept Type: Real (Type)
	test attribute conceptType realType

	# Term:      city
	test Table city
	# Fact type: city has latitude
	test Table factType city, has, latitude
	# 	Necessity: each city has exactly one latitude.
	test attribute necessity 'each', city, has, ['exactly', 'one'], latitude
	# Fact type: city has longitude
	test Table factType city, has, longitude
	# 	Necessity: each city has exactly one longitude.
	test attribute necessity 'each', city, has, ['exactly', 'one'], longitude
	# Fact type: city is available in language
	test Table factType city, verb('is available in'), language
	# 	Term Form: city translation
	test attribute termForm cityTranslation
	# Fact type: city is of country
	test Table factType city, isOf, country
	# 	Necessity: each city is of exactly one country.
	test attribute necessity 'each', city, isOf, ['exactly', 'one'], country

	# Fact type: city translation has name
	test Table factType cityTranslation, has, name
	# 	Necessity: each city translation has exactly one name.
	test attribute necessity 'each', cityTranslation, has, ['exactly', 'one'], name

	# Term:      media type
	test Table mediaType
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Term:      path
	test Table path
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# 	Necessity: each path has a Length (Type) that is less than or equal to 100.
	test attribute necessity 'each', path, has, 'a', [lengthType, verb('is less than or equal to'), 100]

	# Term:      media
	test Table media
	# Fact type: media has path
	test Table factType media, has, path
	# 	Necessity: each media has exactly one path.
	test attribute necessity 'each', media, has, ['exactly', 'one'], path
	# Fact type: media is available in language
	test Table factType media, verb('is available in'), language
	# 	Term Form: media translation
	test attribute termForm mediaTranslation

	# Term:      title
	test Table title
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Term:      description
	test Table description
	# 	Concept Type: Text (Type)
	test attribute conceptType textType
	# 	Necessity: each description has a Length (Type) that is less than or equal to 2000.
	test attribute necessity 'each', description, has, 'a', [lengthType, verb('is less than or equal to'), 2000]

	# Fact type: media translation has title
	test Table factType mediaTranslation, has, title
	#     Necessity: each media translation has exactly one title.
	test attribute necessity 'each', mediaTranslation, has, ['exactly', 'one'], title
	# Fact type: media translation has description
	test Table factType mediaTranslation, has, description
	#     Necessity: each media translation has exactly one description.
	test attribute necessity 'each', mediaTranslation, has, ['exactly', 'one'], description

	# Term:      tour type
	test Table tourType
	# Fact type: tour type is available in language
	test Table factType tourType, verb('is available in'), language
	# 	Term Form: tour type translation
	test attribute termForm tourTypeTranslation

	# Fact type: tour type translation has name
	test Table factType tourTypeTranslation, has, name
	#     Necessity: each tour type translation has exactly one name.
	test attribute necessity 'each', tourTypeTranslation, has, ['exactly', 'one'], name

	# Term:      keyword
	test Table keyword
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# 	Necessity: each keyword has a Length (Type) that is less than or equal to 100.
	test attribute necessity 'each', keyword, has, 'a', [lengthType, verb('is less than or equal to'), 100]

	# Term:	   tour
	test Table tour
	# Fact type: tour is of tour type
	test Table factType tour, isOf, tourType
	#     Necessity: each tour is of exactly one tour type.
	test attribute necessity 'each', tour, isOf, ['exactly', 'one'], tourType
	# Fact type: tour has region
	test Table factType tour, has, region
	#     Necessity: each tour has at least one region.
	test attribute necessity 'each', tour, has, ['at least', 'one'], region
	# Fact type: tour has keyword
	test Table factType tour, has, keyword
	# Fact type: tour has media
	test Table factType tour, has, media
	# Fact type: tour is recommended
	test Table factType tour, verb('is recommended')
	# Fact type: tour is coming soon
	test Table factType tour, verb('is coming soon')
	# Fact type: tour is hidden
	test Table factType tour, verb('is hidden')
	# Fact type: tour is honeymoon
	test Table factType tour, verb('is honeymoon')
	# Fact type: tour is available in language
	test Table factType tour, verb('is available in'), language
	# 	Term Form: tour translation
	test attribute termForm tourTranslation

	# Term:      comment
	test Table comment
	# 	Concept Type: Text (Type)
	test attribute conceptType textType
	# 	Necessity: each comment has a Length (Type) that is less than or equal to 1000.
	test attribute necessity 'each', comment, has, 'a', [lengthType, verb('is less than or equal to'), 1000]

	# Fact type: tour translation has title
	test Table factType tourTranslation, has, title
	#     Necessity: each tour translation has exactly one title.
	test attribute necessity 'each', tourTranslation, has, ['exactly', 'one'], title
	# Fact type: tour translation has description
	test Table factType tourTranslation, has, description
	#     Necessity: each tour translation has exactly one description.
	test attribute necessity 'each', tourTranslation, has, ['exactly', 'one'], description
	# Fact type: tour translation has comment
	test Table factType tourTranslation, has, comment
	#     Necessity: each tour translation has exactly one comment.
	test attribute necessity 'each', tourTranslation, has, ['exactly', 'one'], comment

	# Term:      duration in days
	test Table durationInDays
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      plan
	test Table plan
	# Fact type: plan has duration in days
	test Table factType plan, has, durationInDays
	# 	Necessity: each plan has exactly one duration in days.
	test attribute necessity 'each', plan, has, ['exactly', 'one'], durationInDays
	# Fact type: plan is of tour
	test Table factType plan, isOf, tour
	# 	Necessity: each plan is of exactly one tour.
	test attribute necessity 'each', plan, isOf, ['exactly', 'one'], tour
	# 	Necessity: each tour has at least one plan.
	test attribute necessity 'each', tour, has, ['at least', 'one'], plan

	# Term:      departure date
	test Table departureDate
	# 	Concept Type: Date (Type)
	test attribute conceptType dateType

	# Term:      availability
	test Table availability
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# 	Definition: "no data" or "none" or "low" or "medium" or "high"
	test definitionEnum 'no data', 'none', 'low', 'medium', 'high'

	# Term:      single price
	test Table singlePrice
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      double price
	test Table doublePrice
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      air fee
	test Table airFee
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      application
	test Table application
	# Fact type: application has departure date
	test Table factType application, has, departureDate
	# 	Necessity: each application has exactly one departure date.
	test attribute necessity 'each', application, has, ['exactly', 'one'], departureDate
	# Fact type: application has availability
	test Table factType application, has, availability
	# 	Necessity: each application has exactly one availability.
	test attribute necessity 'each', application, has, ['exactly', 'one'], availability
	# Fact type: application has single price
	test Table factType application, has, singlePrice
	# 	Necessity: each application has exactly one single price.
	test attribute necessity 'each', application, has, ['exactly', 'one'], singlePrice
	# Fact type: application has double price
	test Table factType application, has, doublePrice
	# 	Necessity: each application has exactly one double price.
	test attribute necessity 'each', application, has, ['exactly', 'one'], doublePrice
	# Fact type: application has air fee
	test Table factType application, has, airFee
	# 	Necessity: each application has exactly one air fee.
	test attribute necessity 'each', application, has, ['exactly', 'one'], airFee
	# Fact type: application is hot offer
	test Table factType application, verb('is hot offer')
	# Fact type: application is of plan
	test Table factType application, isOf, plan
	# 	Necessity: each application is of exactly one plan.
	test attribute necessity 'each', application, isOf, ['exactly', 'one'], plan
	# 	Necessity: each plan has at least one application.
	test attribute necessity 'each', plan, has, ['at least', 'one'], application
	# Fact type: application is available in language
	test Table factType application, verb('is available in'), language
	# 	Term Form: application translation
	test attribute termForm applicationTranslation

	# Fact type: application translation has description
	test Table factType applicationTranslation, has, description
	# 	Necessity: each application translation has exactly one description.
	test attribute necessity 'each', applicationTranslation, has, ['exactly', 'one'], description

	# Term:      overnights
	test Table overnights
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      order
	test Table order
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      itinerary
	test Table itinerary
	# Fact type: itinerary has overnights
	test Table factType itinerary, has, overnights
	# 	Necessity: each itinerary has exactly one overnights.
	test attribute necessity 'each', itinerary, has, ['exactly', 'one'], overnights
	# Fact type: itinerary has order
	test Table factType itinerary, has, order
	# 	Necessity: each itinerary has exactly one order.
	test attribute necessity 'each', itinerary, has, ['exactly', 'one'], order
	# Fact type: itinerary is of city
	test Table factType itinerary, isOf, city
	# 	Necessity: each itinerary is of exactly one city.
	test attribute necessity 'each', itinerary, isOf, ['exactly', 'one'], city
	# Fact type: itinerary is of plan
	test Table factType itinerary, isOf, plan
	# 	Necessity: each itinerary is of exactly one plan.
	test attribute necessity 'each', itinerary, isOf, ['exactly', 'one'], plan

	# Term:      day number
	test Table dayNumber
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      location
	test Table location
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	# 	Necessity: each location has a Length (Type) that is less than or equal to 200.
	test attribute necessity 'each', location, has, 'a', [lengthType, verb('is less than or equal to'), 200]

	# Term:      story
	test Table story
	# Fact type: story has day number
	test Table factType story, has, dayNumber
	# 	Necessity: each story has exactly one day number.
	test attribute necessity 'each', story, has, ['exactly', 'one'], dayNumber
	# Fact type: story is of plan
	test Table factType story, isOf, plan
	# 	Necessity: each story is of exactly one plan.
	test attribute necessity 'each', story, isOf, ['exactly', 'one'], plan
	# Fact type: story is available in language
	test Table factType story, verb('is available in'), language
	# 	Term Form: story translation
	test attribute termForm storyTranslation

	# Fact type: story translation has location
	test Table factType storyTranslation, has, location
	#     Necessity: each story translation has exactly one location.
	test attribute necessity 'each', storyTranslation, has, ['exactly', 'one'], location
	# Fact type: story translation has description
	test Table factType storyTranslation, has, description
	#     Necessity: each story translation has exactly one description.
	test attribute necessity 'each', storyTranslation, has, ['exactly', 'one'], description

	# Term:      requirement
	test Table requirement
	# 	Note: Things a traveller must do before travelling
	test note 'Things a traveller must do before travelling'
	# Fact type: requirement is of tour
	test Table factType requirement, isOf, tour
	# 	Necessity: each requirement is of exactly one tour.
	test attribute necessity 'each', requirement, isOf, ['exactly', 'one'], tour
	# Fact type: requirement is available in language
	test Table factType requirement, verb('is available in'), language
	# 	Term Form: requirement translation
	test attribute termForm requirementTranslation

	# Fact type: requirement translation has description
	test Table factType requirementTranslation, has, description
	#     Necessity: each requirement translation has exactly one description.
	test attribute necessity 'each', requirementTranslation, has, ['exactly', 'one'], description

	# Term:      recommendation
	test Table recommendation
	# 	Note: e.g. Malaria treatment
	test note 'e.g. Malaria treatment'
	# Fact type: recommendation is of tour
	test Table factType recommendation, isOf, tour
	# 	Necessity: each recommendation is of exactly one tour.
	test attribute necessity 'each', recommendation, isOf, ['exactly', 'one'], tour
	# Fact type: recommendation is available in language
	test Table factType recommendation, verb('is available in'), language
	# 	Term Form: recommendation translation
	test attribute termForm recommendationTranslation

	# Fact type: recommendation translation has description
	test Table factType recommendationTranslation, has, description
	#     Necessity: each recommendation translation has exactly one description.
	test attribute necessity 'each', recommendationTranslation, has, ['exactly', 'one'], description

	# Term:      url
	test Table url
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Term:      link category
	test Table linkCategory
	# Fact type: link category has name
	test Table factType linkCategory, has, name
	# 	Necessity: each link category has exactly one name.
	test attribute necessity 'each', linkCategory, has, ['exactly', 'one'], name

	# Term:      link
	test Table link
	# Fact type: link has url
	test Table factType link, has, url
	# 	Necessity: each link has exactly one url.
	test attribute necessity 'each', link, has, ['exactly', 'one'], url
	# Fact type: link has link category
	test Table factType link, has, linkCategory
	# Fact type: tour has link
	test Table factType tour, has, link
	# Fact type: link is available in language
	test Table factType link, verb('is available in'), language
	# 	Term Form: link translation
	test attribute termForm linkTranslation

	# Fact type: link translation has title
	test Table factType linkTranslation, has, title
	#     Necessity: each link translation has exactly one title.
	test attribute necessity 'each', linkTranslation, has, ['exactly', 'one'], title

	# Term:      width
	test Table width
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      height
	test Table height
	# 	Concept Type: Integer (Type)
	test attribute conceptType integerType

	# Term:      banner
	test Table banner
	# Fact type: banner is of media
	test Table factType banner, isOf, media
	# 	Necessity: each banner is of exactly one media.
	test attribute necessity 'each', banner, isOf, ['exactly', 'one'], media
	# Fact type: banner has url
	test Table factType banner, has, url
	# 	Necessity: each banner has exactly one url.
	test attribute necessity 'each', banner, has, ['exactly', 'one'], url
	# Fact type: banner has width
	test Table factType banner, has, width
	# 	Necessity: each banner has exactly one width.
	test attribute necessity 'each', banner, has, ['exactly', 'one'], width
	# Fact type: banner has height
	test Table factType banner, has, height
	# 	Necessity: each banner has exactly one height.
	test attribute necessity 'each', banner, has, ['exactly', 'one'], height
	# Fact type: banner is enabled
	test Table factType banner, verb('is enabled')
	# Fact type: banner is available in language
	test Table factType banner, verb('is available in'), language
	# 	Term Form: banner translation
	test attribute termForm bannerTranslation

	# Fact type: banner translation has title
	test Table factType bannerTranslation, has, title
	#     Necessity: each banner translation has exactly one title.
	test attribute necessity 'each', bannerTranslation, has, ['exactly', 'one'], title
	# Fact type: banner translation has description
	test Table factType bannerTranslation, has, description
	#     Necessity: each banner translation has exactly one description.
	test attribute necessity 'each', bannerTranslation, has, ['exactly', 'one'], description

	# Term:    first name
	test Table firstName
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	#     Necessity: each first name has a Length (Type) that is less than or equal to 100.
	test attribute necessity 'each', firstName, has, 'a', [lengthType, verb('is less than or equal to'), 100]

	# Term:    last name
	test Table lastName
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType
	#     Necessity: each last name has a Length (Type) that is less than or equal to 100.
	test attribute necessity 'each', lastName, has, 'a', [lengthType, verb('is less than or equal to'), 100]

	# Term:    email
	test Table email
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Term:      subscriber
	test Table subscriber
	# Fact type: subscriber has first name
	test Table factType subscriber, has, firstName
	# 	Necessity: each subscriber has at most one first name.
	test attribute necessity 'each', subscriber, has, ['at most', 'one'], firstName
	# Fact type: subscriber has last name
	test Table factType subscriber, has, lastName
	# 	Necessity: each subscriber has at most one last name.
	test attribute necessity 'each', subscriber, has, ['at most', 'one'], lastName
	# Fact type: subscriber has email
	test Table factType subscriber, has, email
	# 	Necessity: each subscriber has exactly one email.
	test attribute necessity 'each', subscriber, has, ['exactly', 'one'], email

	# Term:      recipient group
	test Table recipientGroup
	# Fact type: recipient group has name
	test Table factType recipientGroup, has, name
	# 	Necessity: each recipient group has exactly one name.
	test attribute necessity 'each', recipientGroup, has, ['exactly', 'one'], name
	# Fact type: recipient group has subscriber
	test Table factType recipientGroup, has, subscriber

	# Term:      service
	test Table service
	# Fact Type: service has name
	test Table factType service, has, name
	# 	Necessity: each service has exactly one name.
	test attribute necessity 'each', service, has, ['exactly', 'one'], name
	# Fact Type: service has language
	test Table factType service, has, language
	# 	Necessity: each service has exactly one language.
	test attribute necessity 'each', service, has, ['exactly', 'one'], language

	# Fact type: tour includes service
	test Table factType tour, verb('includes'), service
	# 	Term form: service inclusion
	test attribute termForm serviceInclusion
	# Fact type: service inclusion has order
	test Table factType serviceInclusion, has, order
	# 	Necessity: each service inclusion has exactly one order.
	test attribute necessity 'each', serviceInclusion, has, ['exactly', 'one'], order
	# Fact type: service inclusion has description
	test Table factType serviceInclusion, has, description
	# 	Necessity: each service inclusion has exactly one description.
	test attribute necessity 'each', serviceInclusion, has, ['exactly', 'one'], description

	# Fact type: tour excludes service
	test Table factType tour, verb('excludes'), service
	# 	Term form: service exclusion
	test attribute termForm serviceExclusion
	# Fact type: service exclusion has order
	test Table factType serviceExclusion, has, order
	# 	Necessity: each service exclusion has exactly one order.
	test attribute necessity 'each', serviceExclusion, has, ['exactly', 'one'], order
	# Fact type: service exclusion has description
	test Table factType serviceExclusion, has, description
	# 	Necessity: each service exclusion has exactly one description.
	test attribute necessity 'each', serviceExclusion, has, ['exactly', 'one'], description

	# Term:       option
	test Table option
	# Fact type:  option has name
	test Table factType option, has, name
	# 	Necessity: each option has exactly one name
	test attribute necessity 'each', option, has, ['exactly', 'one'], name

	# Term:       site
	test Table site
	# Fact type:  site has name
	test Table factType site, has, name
	# 	Necessity: each site has exactly one name
	test attribute necessity 'each', site, has, ['exactly', 'one'], name
	# Fact type:  site supports option in language
	test Table factType site, verb('supports'), option, verb('in'), language
	# 	Term Form: site option
	test attribute termForm siteOption

	# Term:       value
	test Table value
	# 	Concept Type: Short Text (Type)
	test attribute conceptType shortTextType

	# Fact type:  site option has value
	test Table factType siteOption, has, value
	# 	Necessity: each site option has exactly one value
	test attribute necessity 'each', siteOption, has, ['exactly', 'one'], value

	# Term:       page
	test Table page
	# Fact type: page is available in language
	test Table factType page, verb('is available in'), language
	# 	Term Form: page translation
	test attribute termForm pageTranslation

	# Term:      body
	test Table body
	# 	Concept Type: Text (Type)
	test attribute conceptType textType
	# 	Necessity: each body has a Length (Type) that is less than or equal to 2000.
	test attribute necessity 'each', body, has, 'a', [lengthType, verb('is less than or equal to'), 2000]

	# Fact type:  page translation has title
	test Table factType pageTranslation, has, title
	# 	Necessity: each page translation has exactly one title
	test attribute necessity 'each', pageTranslation, has, ['exactly', 'one'], title
	# Fact type:  page translation has body
	test Table factType pageTranslation, has, body
	# 	Necessity: each page translation has exactly one body
	test attribute necessity 'each', pageTranslation, has, ['exactly', 'one'], body
