import { fetchResponse, readCredentials } from "../utilFunctions.js"


export async function createProfiles(options) {
    const queryName = options.name
    
    const response = await fetchResponse('POST', '/api/profiles', {name: queryName}) // returns object

    if (response && response.status !== 'success') {
        console.log(`Error: ${response.message}`)
    }

    console.log(response)
    return
}