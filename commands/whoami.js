import { fetchResponse, readCredentials } from "../utilFunctions.js"

export async function whoami() {
    const credentials = await readCredentials()

    console.log(credentials.username)
    return
}