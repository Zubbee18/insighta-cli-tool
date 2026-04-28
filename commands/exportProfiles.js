import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { fetchResponse, readCredentials } from "../utilFunctions.js"

export async function exportProfiles(options) {

    // get the queries
    const { format, gender, country, ageGroup, minAge,
            maxAge, minGenderProbability, minCountryProbability, 
            sortBy, order, page, limit } = options

    let paramsObj = {}

    if (format) paramsObj.format = format
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

    const response = await fetchResponse('GET', `/api/profiles/export?${params}`)

    if (response) {
        // If format is CSV and we got the CSV data, save it to a file
        if (format && format.toLowerCase() === 'csv' && response.filename) {
            // Generate filename with timestamp
            const filePath = resolve(process.cwd(), response.filename)
            
            try {
                // Write CSV to file in current working directory
                await fs.writeFile(filePath, response.data, 'utf8')
                console.log(`✓ CSV file saved successfully to: ${filePath}`)

            } catch (err) {
                console.error(`Error saving CSV file: ${err.message}`)
            }
        } else {
            console.log('Profile data is in JSON format, use --format csv to export as csv file', response)
        }
    }
    return
}