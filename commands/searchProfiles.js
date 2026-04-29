import { fetchResponse, paginateTable } from "../utilFunctions.js"

export async function searchProfiles(queryString) {
    // Fetch function for pagination
    const fetchPage = async (opts) => {
        const params = new URLSearchParams({ q: queryString, page: opts.page })
        return await fetchResponse('GET', `/api/profiles/search?${params}`)
    }

    // Use pagination
    await paginateTable(fetchPage, { page: 1 })
}