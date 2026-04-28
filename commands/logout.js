import { fetchResponse, getCredentials } from "../utilFunctions.js"

export async function logout() {
    const credentials = await getCredentials()
    const response = await fetchResponse('POST', '/auth/logout', {refresh_token: credentials.refresh_token})
    console.log(response.message)
}