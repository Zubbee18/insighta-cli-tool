import { fetchResponse, readCredentials } from "../utilFunctions.js"
import { logger } from "../logger.js"
import { createSpinner } from "../spinner.js"

export async function logout() {
    const spinner = createSpinner('Logging out...')
    spinner.start()
    
    const credentials = await readCredentials()
    const response = await fetchResponse('POST', '/auth/logout', {refresh_token: credentials.refresh_token}, false)
    
    if (!response) {
        spinner.fail('Logout failed - authentication error')
        process.exit(1)
    }
    
    if (response) {
        spinner.succeed(response.message)
    } else {
        spinner.fail('Logout failed')
    }
}