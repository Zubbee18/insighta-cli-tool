import { fetchResponse, readCredentials } from "../utilFunctions.js"
import { logger } from "../logger.js"

export async function whoami() {
    const credentials = await readCredentials()

    logger.highlight(`@${credentials.username}`)
    return
}