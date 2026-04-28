import { options } from '../index.js'
import axios from 'axios'

// const name = options.name
// console.log(name)

export async function createProfiles(name) {
    await axios.post(`${process.env.API_URL}`, JSON.stringify({
        name: name
    }), 
    {
        headers: { 'Accept': 'application/json',
                    'X-Api-Version': '1',
                    'getSetCookie': ''
        }
    })
}