import { fetchResponse, readCredentials } from "../utilFunctions.js"

export async function getProfiles(options) {
	// get the queries
	const { gender, country, ageGroup, minAge,
			maxAge, minGenderProbability, minCountryProbability, 
			sortBy, order, page, limit } = options

	let paramsObj = {}

	if (gender) paramsObj.gender = gender
	if (country) paramsObj.country_id = country
	if (ageGroup) paramsObj.age_group = ageGroup
	if (minAge) paramsObj.min_age = minAge
	if (maxAge) paramsObj.max_age = maxAge
	if (minGenderProbability) paramsObj.min_gender_probability = minGenderProbability
	if (minCountryProbability) paramsObj.min_country_probability = minCountryProbability
	if (sortBy) paramsObj.sort_by = sortBy
	if (order) paramsObj.order = order
	if (page) paramsObj.page = page
	if (limit) paramsObj.limit = limit

	const params = new URLSearchParams(paramsObj)

	const response = await fetchResponse('GET', `/api/profiles?${params}`)

	if (response) console.log(response)
	return
}