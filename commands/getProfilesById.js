import { fetchResponse, formatProfileDetails } from "../utilFunctions.js"
import { logger } from "../logger.js"
import { createSpinner } from "../spinner.js"

export async function getProfilesById(id) {
    const spinner = createSpinner(`Fetching profile ${id}...`)
    spinner.start()
    
    const response = await fetchResponse('GET', `/api/profiles/${id}`, '', false)
    
    spinner.stop()

    if (!response) {
        logger.error('Failed to fetch profile. Please login again.')
        process.exit(1)
    }

    if (response && response.data) {
        formatProfileDetails(response.data)
    } else if (response) {
        formatProfileDetails(response)
    } else {
        logger.error('Profile not found')
    }
    return
}