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
    .command('logout')
    .description('Logout from Insighta Labs Account')
    .action(logout)

// insighta whoami
program
    .command('whoami')
    .description('Get User Profile data')
    .action(whoami)

// insighta profiles list command
program
    .command('profiles list')
    .description('send GET request to profiles endpoint')
    .option('--gender <gender>', 'get by gender')
    .option('--country <country_id>', 'get by country_id')
    .option('--age-group <age_group>', 'get by age group')
    .option('--min-age <min_age>', 'get by min age')
    .option('--max-age <max_age>', 'get by max age')
    .option('--min-gender-probability <min_gender_probability>', 'get by min gender probability')
    .option('--min-country-probability <min_country_probability>', 'get by min country probability')

    .addOption(new Option('--sort-by <sort_by>', 'sort profiles by')
    .choices(['age', 'created_at', 'gender_probability']))

    .addOption(new Option('--order <order>', 'order profiles by')
    .default(asc, 'ascending')).choices(['desc', 'asc'])

    .addOption(new Option('--page <number>', 'page number')
    .default(1, 'page one'))

    .addOption(new Option('--limit <limit>', 'limit values by')
    .default(10, 'ten values'))

    .action(getProfiles)


// insighta profiles get command
program
    .command('profiles get')
    .argument('<id>', 'id to get by')
    .action(getProfilesById)


// insighta profiles search command
program
    .command('profiles search')
    .argument('<query-string>', 'string to query by')
    .action(searchProfiles)
    
// insighta profiles create command
program
    .command('profiles create')
    .option('--name', 'name to process and store')
    .argument('<name>', 'name in string')
    .action(createProfiles)

// insighta profiles export command
program
    .command('profiles export')
    .option('--export', 'specify export format')
    .option('--gender <gender>', 'get by gender')
    .option('--country <country_id>', 'get by country_id')
    .option('--age-group <age_group>', 'get by age group')
    .option('--min-age <min_age>', 'get by min age')
    .option('--max-age <max_age>', 'get by max age')
    .option('--min-gender-probability <min_gender_probability>', 'get by min gender probability')
    .option('--min-country-probability <min_country_probability>', 'get by min country probability')

    .addOption(new Option('--sort-by <sort_by>', 'sort profiles by')
    .choices(['age', 'created_at', 'gender_probability']))

    .addOption(new Option('--order <order>', 'order profiles by')
    .default(asc, 'ascending')).choices(['desc', 'asc'])

    .addOption(new Option('--page <number>', 'page number')
    .default(1, 'page one'))

    .addOption(new Option('--limit <limit>', 'limit values by')
    .default(10, 'ten values'))
    
    .action(exportProfiles)


// Process the CLI commands
program.parse(process.argv)

export const options = program.opts()