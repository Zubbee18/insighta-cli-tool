import { fetchResponse, readCredentials } from "../utilFunctions.js"

export async function logout() {
    const credentials = await readCredentials()
    const response = await fetchResponse('POST', '/auth/logout', {refresh_token: credentials.refresh_token})
    if (response) console.log(response.message)
}