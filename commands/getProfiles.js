import { fetchResponse, readCredentials, formatTable, paginateTable } from "../utilFunctions.js"

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
	if (limit) paramsObj.limit = limit

	// Fetch function for pagination
	const fetchPage = async (opts) => {
		const pageParams = { ...paramsObj, page: opts.page }
		const params = new URLSearchParams(pageParams)
		return await fetchResponse('GET', `/api/profiles?${params}`)
	}

	// Use pagination
	await paginateTable(fetchPage, { page: page || 1 })
}