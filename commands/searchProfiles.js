import { fetchResponse } from "../utilFunctions.js"

export async function searchProfiles(queryString) {
    const params = new URLSearchParams({q: queryString})
    const response = await fetchResponse('GET', `/api/profiles/search?${params}`)

    if (response) console.log(response)
    return
}