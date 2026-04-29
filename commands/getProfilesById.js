import { fetchResponse } from "../utilFunctions.js"

export async function getProfilesById(id) {

    const response = await fetchResponse('GET', `/api/profiles/${id}`)

    if (response) console.log(response)
    return
}