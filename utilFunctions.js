import { access } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function fetchResponse(method='GET', urlPath, body='') {
    const credentials = await readCredentials()

    let option = {
        method: method,
        headers : {
            'x-api-version' : '1',
            'Cookie' : `access_token=${credentials.access_token}`,
            'Accept': 'application/json'
        }
    }  
    
    if (method === 'POST') {
        option.body = body ? JSON.stringify(body) : ''
        option.headers['Content-Type'] = 'application/json' 
    }
    
    try {
        const response = await fetch(`${process.env.API_URL}${urlPath}`, option)
    
        if (!response.ok) {
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                const responseObj = await response.json()
                if (responseObj.message === 'Access Token has expired') {
                    return await refreshCredentials(credentials)
                }

                console.error(`HTTP error! status: ${response.status} message: ${responseObj.message}`)
                return 

            } else {
                const text = await response.text()
                console.error(`HTTP error! status: ${response.status}, received HTML instead of JSON`)
                console.error('Response:', text.substring(0, 200))
                return
            }
            throw new Error(`Request failed with status ${response.status}`)
        }
        
        const data = await response.json()
        return data

    
    } catch(err) {
        
        console.error('Fetch failed: ', err)
        throw err
    }

}

export async function readCredentials() {
    const filePath = path.join('./.insighta', 'credentials.json')
    const content = await fs.readFile(filePath, {encoding: 'utf-8'})
    const credentials = JSON.parse(content)

    return credentials // object
}

async function writeCredentials(newCredentials) {
    const oldCredentials = await readCredentials()
    const filePath = path.join('./.insighta', 'credentials.json')
    const credentials = {
        username: oldCredentials.username, 
        access_token: newCredentials.access_token, 
        refresh_token: newCredentials.refresh_token
    }

    await fs.writeFile(filePath, JSON.stringify(credentials, null, 2), {encoding: 'utf-8'})  // ← Add JSON.stringify

    return newCredentials
}

async function refreshCredentials(oldCredentials) {
    try {
        const credentialsResponse = await fetch(`${process.env.API_URL}/auth/refresh`, {
            method: 'POST',
            headers : {
                'x-api-version' : '1',
                'Cookie' : `access_token=${oldCredentials.access_token}`,
                'Content-Type': 'application/json'  // ← Add this
            },
            body: JSON.stringify({refresh_token: oldCredentials.refresh_token})
        })

        // ← Add this check
        if (!credentialsResponse.ok) {
            const text = await credentialsResponse.text()
            throw new Error(`Refresh failed: ${credentialsResponse.status} - ${text.substring(0, 100)}`)
        }

        const newCredentialsObj = await credentialsResponse.json()

        if (newCredentialsObj.status !== 'success') {
            if (newCredentialsObj.message === 'Refresh Token has expired') {
                console.log(`Refresh token has expired. Run 'insighta login' to login again.`)
                return
            }
            
            throw new Error('Refresh credentials was not successful')
        }

        const newCredentials = await writeCredentials(newCredentialsObj)
        return newCredentials

    } catch(err) {
        console.error('Refresh failed:', err.message)
        throw err
    }
}