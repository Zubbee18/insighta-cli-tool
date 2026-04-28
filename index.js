#! /usr/bin/env node

import { program } from 'commander'
import chalk from 'chalk'

// Define the "insighta login" command
program
    .command('login')
    .description('Login with GitHub')
    .action(login) // function called login


// insighta logout
program
    .command('insighta logout')
    .description('Logout from Insighta Labs Account')
    .action( () => {
        // logout - send a get req to logout endpoint
            
    })

// insighta whoami
program
    .command('insighta whoami')
    .description('Get User Profile data')
    .action( () => {
        // whoami - send a get req to user endpoint with the user id to get info
            
    })

program
    .command('insighta whoami')
    .description('Get User Profile data')
    .action( () => {
        // whoami - send a get req to user endpoint with the user id to get info
            
    })

// Process the CLI commands
program.parse(process.argv);