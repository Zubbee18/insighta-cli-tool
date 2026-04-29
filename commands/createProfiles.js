import { fetchResponse, readCredentials, formatProfileDetails } from "../utilFunctions.js"
import { logger } from "../logger.js"
import { createSpinner } from "../spinner.js"

export async function createProfiles(options) {
    const queryName = options.name
    
    const spinner = createSpinner(`Creating profile for "${queryName}"...`)
    spinner.start()
    
    const response = await fetchResponse('POST', '/api/profiles', {name: queryName}, false) // Don't show inner spinner

    spinner.stop()

    if (!response) {
        // Authentication or fetch failed
        process.exit(1)
    }

    if (response && response.status !== 'success') {
        logger.error(`Error: ${response.message}`)
        return
    }

    logger.success('Profile created successfully!')
    console.log() // Empty line
    
    if (response.data) {
        formatProfileDetails(response.data)
    } else {
        formatProfileDetails(response)
    }
}