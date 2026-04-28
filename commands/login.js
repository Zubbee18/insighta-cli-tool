import crypto from 'crypto'
import dotenv from 'dotenv'
import open from 'open'
import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { exec } from 'child_process'
import { promisify } from 'util'

dotenv.config()

const execAsync = promisify(exec)

export async function login() {
    // generate state for github
    const state = crypto.randomBytes(16).toString('hex')

    // PKCE verifier
    const verifier = generateVerifier()
    const challenge = generateChallenge(verifier)

    // Start the callback server (don't await yet)
    const serverPromise = startCallbackServer(state, verifier)

    // constructor parameters for github request
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        state: state,
        redirect_uri: 'http://127.0.0.1:4000/auth/github/callback',
        scope: 'user:email',
        code_challenge: challenge,
        code_challenge_method: 'S256'
    })

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`

    // sends the user to github with parameters
    console.log('Opening browser for GitHub authorization...')
    
    try {
        // For Windows (including Git Bash), use the start command
        if (process.platform === 'win32') {
            // Use cmd /c start to ensure it works in Git Bash
            await execAsync(`cmd.exe /c start "" "${authUrl}"`)
        } else {
            await open(authUrl)
        }
        console.log('Browser opened successfully!')
    } catch (error) {
        console.log('\n⚠️  Could not open browser automatically.')
        console.log('Please copy and paste this URL into your browser:')
        console.log(`\n${authUrl}\n`)
    }

    console.log('Waiting for GitHub authorization...')
    
    // Now wait for the callback
    try {
        await serverPromise

    } catch (error) {
        console.error('Authentication failed:', error.message)
        process.exit(1)
    }
}

// ======================= HELPER FUNCTIONS ====================================
// generate code-verifier
function generateVerifier() {
    return crypto.randomBytes(32).toString('base64url')
}

// generate code-challenger from verifier
function generateChallenge(verifier) {
    return crypto.createHash('sha256')
        .update(verifier)
        .digest()
        .toString('base64url')
}

function startCallbackServer(expectedState, verifier) {
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, 'http://localhost:4000');
            
            if (url.pathname === '/auth/github/callback') {
                const code = url.searchParams.get('code')
                const state = url.searchParams.get('state')
                
                // Validate state to prevent CSRF
                if (state !== expectedState) {
                    res.writeHead(400)
                    res.end('Invalid state parameter');
                    server.close()
                    return reject(new Error('Invalid state'));
                }
                
                // Exchange code for token
                try {
                    const tokenObj = await sendCodeForToken(code, verifier)

                    console.log(tokenObj)
                    const access_token = tokenObj.access_token
                    const refresh_token = tokenObj.refresh_token
                    
                    // Save tokens in credentials file
                    await saveToken(refresh_token, access_token)
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' })
                    res.end('<h1>Login successful! You can close this window.</h1>')
                    
                    console.log('✓ Login successful!')
                    
                    // Close server after handling callback
                    server.close()
                    resolve(tokenObj)

                } catch (error) {
                    res.writeHead(500)
                    res.end('Error during authentication')
                    server.close()
                    reject(error)
                }
            }
        })
        
        server.listen(4000, () => {
            console.log('Local server started on http://localhost:4000');
        })
        
        // Timeout after 5 minutes
        setTimeout(() => {
            server.close();
            reject(new Error('Authentication timeout'));
        }, 5 * 60 * 1000);
    })
}

async function sendCodeForToken(code, verifier) {
    const apiUrl = `${process.env.API_URL}/auth/github/cli/callback`
    console.log('Sending request to:', apiUrl)
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: code,
            code_verifier: verifier
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(`API request failed: ${errorData.message || response.statusText}`)
    }
    
    const data = await response.json()
    return data
}

async function saveToken(refresh_token, access_token) {

    try {

        // create folder
        const folderPath = path.join('.insighta')
        await fs.mkdir(folderPath, { recursive: true })
        const filePath = path.join(folderPath, 'credentials.json')
        
        const credentials = JSON.stringify({
            access_token: access_token, 
            refresh_token: refresh_token
        }, null, 2)
        
        await fs.writeFile(filePath, credentials)
        console.log("saving token in credentials.json")

    } catch(err) {
        console.error('Error saving credentials:', err)
        throw err
    }

}