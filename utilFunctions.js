import fs from 'node:fs/promises'
import path from 'node:path'

export async function fetchResponse(method='GET', urlPath, body='') {
    const credentials = await getCredentials()

    let option = {
        method: method,
        headers : {
            'x-api-version' : '1',
            'Cookie' : `access_token=${credentials.access_token}`
        }
    }

    if (method === 'POST') {
        option.body = body ? JSON.stringify(body) : ''
        option.headers['Content-Type'] = 'application/json' 
    }

    try {
        const response = await fetch(`${process.env.API_URL}${urlPath}`, option)

        if (!response.ok) {
            const data = await response.json()
            throw new Error(`HTTP error! status: ${response.status} message: ${data.message}`)
        }

        const data = await response.json()
        return data

    } catch(err) {
        console.error('Fetch failed: ', err)
        throw err
    }

}

export async function getCredentials() {
    const filePath = path.join('./.insighta', 'credentials.json')
    const content = await fs.readFile(filePath, {encoding: 'utf-8'})
    const credentials = JSON.parse(content)

    return credentials // object
}