import { fetchResponse, getCredentials } from "../utilFunctions.js"

export function whoami() {
    const credentials = await getCredentials()

    console.log(credentials.username)
    return
}