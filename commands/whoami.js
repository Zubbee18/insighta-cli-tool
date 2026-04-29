import { fetchResponse, formatProfileDetails } from "../utilFunctions.js"
import { logger } from "../logger.js"
import { createSpinner } from "../spinner.js"

export async function whoami() {
    const spinner = createSpinner('Fetching user information...')
    spinner.start()
    
    const response = await fetchResponse('GET', '/api/users/me', '', false)
    
    spinner.stop()

    if (!response) {
        logger.error('Failed to fetch user information. Please login again.')
        process.exit(1)
    }

    if (response && response.data) {
        formatProfileDetails(response.data)
    } else if (response) {
        formatProfileDetails(response)
    } else {
        logger.error('User information not found')
    }
    return
}