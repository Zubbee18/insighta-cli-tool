# Insighta CLI Tool

A powerful command-line interface for interacting with the Insighta Labs profile management system. Built with Node.js, featuring secure GitHub OAuth authentication with PKCE, automatic token refresh, and intuitive profile management commands.

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Authentication Flow](#authentication-flow)
- [Installation](#installation)
- [Configuration](#configuration)
- [CLI Usage](#cli-usage)
  - [Authentication Commands](#authentication-commands)
  - [Profile Management Commands](#profile-management-commands)
- [Token Handling Approach](#token-handling-approach)
- [Role Enforcement Logic](#role-enforcement-logic)
- [Natural Language Parsing](#natural-language-parsing)
- [Technical Details](#technical-details)
- [Error Handling](#error-handling)
- [Development](#development)

## Features

✅ **Secure Authentication**: GitHub OAuth with PKCE (Proof Key for Code Exchange)  
✅ **Automatic Token Refresh**: Seamless token renewal without user intervention  
✅ **Credential Storage**: Secure local storage at `~/.insighta/credentials.json`  
✅ **Beautiful Tables**: Structured data display with pagination  
✅ **Loading Indicators**: Real-time feedback with spinners during operations  
✅ **Natural Language Search**: Query profiles using plain English  
✅ **CSV Export**: Export filtered profiles to the current working directory  
✅ **Comprehensive Filtering**: Filter by gender, country, age range, and more  
✅ **Error Handling**: Clear error messages and automatic recovery

## System Architecture

```
┌─────────────────┐
│   CLI Client    │
│   (insighta)    │
└────────┬────────┘
         │
         │ HTTPS Requests
         │ (with access_token in Cookie)
         │
         ▼
┌─────────────────────────────────────────┐
│         Backend API Server              │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │   Authentication Middleware     │  │
│  │   - Verify JWT tokens          │  │
│  │   - Role enforcement           │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │      API Routes                 │  │
│  │   - /auth/*                     │  │
│  │   - /api/profiles/*             │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │     Database Layer              │  │
│  │   - PostgreSQL                  │  │
│  │   - Redis (token blacklist)    │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ▲
         │
         │ OAuth Callback
         │
┌────────┴────────┐
│  GitHub OAuth   │
│    Service      │
└─────────────────┘
```

### Component Breakdown

1. **CLI Client**: Node.js application using Commander.js for command parsing
2. **HTTP Client**: Axios for API communication with automatic retry logic
3. **Local Callback Server**: Temporary HTTP server for OAuth callback handling
4. **Backend API**: Express.js server handling authentication and profile management
5. **Database**: PostgreSQL for persistent data, Redis for token blacklist
6. **GitHub OAuth**: Third-party authentication provider

## Authentication Flow

### CLI Authentication Flow (PKCE OAuth)

The CLI implements OAuth 2.0 with PKCE (Proof Key for Code Exchange) for enhanced security:

```
┌──────┐                                ┌──────┐                  ┌──────────┐                ┌─────────┐
│ User │                                │ CLI  │                  │ Backend  │                │ GitHub  │
└──┬───┘                                └──┬───┘                  └────┬─────┘                └────┬────┘
   │                                       │                           │                           │
   │ 1. insighta login                     │                           │                           │
   ├──────────────────────────────────────>│                           │                           │
   │                                       │                           │                           │
   │                                       │ 2. Generate:              │                           │
   │                                       │    - state (CSRF token)   │                           │
   │                                       │    - code_verifier        │                           │
   │                                       │    - code_challenge       │                           │
   │                                       │                           │                           │
   │                                       │ 3. Start callback server  │                           │
   │                                       │    on localhost:4000      │                           │
   │                                       │                           │                           │
   │                                       │ 4. Open browser with      │                           │
   │                                       │    GitHub OAuth URL       │                           │
   │                                       ├───────────────────────────┼──────────────────────────>│
   │                                       │                           │                           │
   │ 5. User authorizes application        │                           │                           │
   ├───────────────────────────────────────┼───────────────────────────┼──────────────────────────>│
   │                                       │                           │                           │
   │                                       │                           │ 6. Redirect with code     │
   │                                       │<──────────────────────────┼───────────────────────────┤
   │                                       │                           │                           │
   │                                       │ 7. Validate state         │                           │
   │                                       │                           │                           │
   │                                       │ 8. Send code + verifier   │                           │
   │                                       ├──────────────────────────>│                           │
   │                                       │                           │                           │
   │                                       │                           │ 9. Exchange code for      │
   │                                       │                           │    access_token with      │
   │                                       │                           │    GitHub                 │
   │                                       │                           ├──────────────────────────>│
   │                                       │                           │                           │
   │                                       │                           │ 10. Return access_token   │
   │                                       │                           │<──────────────────────────┤
   │                                       │                           │                           │
   │                                       │                           │ 11. Fetch user data       │
   │                                       │                           ├──────────────────────────>│
   │                                       │                           │                           │
   │                                       │                           │ 12. Return user info      │
   │                                       │                           │<──────────────────────────┤
   │                                       │                           │                           │
   │                                       │                           │ 13. Create/update user    │
   │                                       │                           │     in database           │
   │                                       │                           │                           │
   │                                       │ 14. Return tokens:        │                           │
   │                                       │     - access_token (3min) │                           │
   │                                       │     - refresh_token (5min)│                           │
   │                                       │     - username            │                           │
   │                                       │<──────────────────────────┤                           │
   │                                       │                           │                           │
   │                                       │ 15. Save credentials to   │                           │
   │                                       │     ~/.insighta/          │                           │
   │                                       │     credentials.json      │                           │
   │                                       │                           │                           │
   │ 16. Display "Logged in as @username"  │                           │                           │
   │<──────────────────────────────────────┤                           │                           │
   │                                       │                           │                           │
```

### Key Security Features

1. **PKCE Implementation**: 
   - `code_verifier`: 32-byte random value (Base64URL encoded)
   - `code_challenge`: SHA-256 hash of verifier (Base64URL encoded)
   - Prevents authorization code interception attacks

2. **State Parameter**: 
   - 16-byte random hex value
   - Validates callback authenticity
   - Prevents CSRF attacks

3. **Local Callback Server**:
   - Temporary HTTP server on localhost:4000
   - Auto-closes after successful authentication
   - 5-minute timeout for security

### Token Lifecycle

```
Access Token (3 minutes)  ──────> Used for API requests
                                  │
                                  ▼
                              Expired?
                                  │
                                  ├─ No ──> Continue using
                                  │
                                  ├─ Yes ──> Auto-refresh
                                             │
                                             ▼
Refresh Token (5 minutes) ────────────> POST /auth/refresh
                                             │
                                             ▼
                                        New Token Pair
                                             │
                                             ├─ Success ──> Continue
                                             │
                                             ├─ Expired ──> Prompt re-login
```

## Installation

### Global Installation

```bash
# Clone the repository
git clone <repository-url>
cd cli-tool

# Install dependencies
npm install

# Link globally
npm link
```

After installation, the `insighta` command will be available globally from any directory.

### Verify Installation

```bash
insighta --version
```

## Configuration

### Environment Variables

Create a `.env` file in the cli-tool directory:

```env
API_URL=https://your-backend-url.com
GITHUB_CLIENT_ID=your_github_client_id
```

### Credentials Storage

Credentials are automatically stored at:
- **Linux/macOS**: `~/.insighta/credentials.json`
- **Windows**: `%USERPROFILE%\.insighta\credentials.json`

**Credentials File Structure**:
```json
{
  "username": "your-github-username",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## CLI Usage

### Authentication Commands

#### Login

Authenticate with your GitHub account:

```bash
insighta login
```

**Behavior**:
1. Opens browser to GitHub OAuth page
2. User authorizes the application
3. CLI receives callback and exchanges code for tokens
4. Saves credentials locally
5. Displays confirmation: `Logged in as @username`

---

#### Logout

Invalidate your refresh token and remove local credentials:

```bash
insighta logout
```

**Behavior**:
1. Sends logout request to backend (invalidates refresh token)
2. Removes `~/.insighta/credentials.json`
3. Displays confirmation message

---

#### Who Am I

Display currently logged-in user information:

```bash
insighta whoami
```

**Output**:
```
┌──────────────┬─────────────────────────────┐
│ Field        │ Value                       │
├──────────────┼─────────────────────────────┤
│ ID           │ 123                         │
│ Username     │ johndoe                     │
│ Email        │ john@example.com            │
│ Role         │ admin                       │
│ Created At   │ 2026-01-15T10:30:00.000Z    │
└──────────────┴─────────────────────────────┘
```

### Profile Management Commands

#### List Profiles

Display all profiles with optional filtering and sorting:

```bash
# Basic listing (with pagination)
insighta profiles list

# Filter by gender
insighta profiles list --gender male
insighta profiles list --gender female

# Filter by country (ISO 3166-1 alpha-2 code)
insighta profiles list --country NG
insighta profiles list --country US

# Filter by age group
insighta profiles list --age-group adult
insighta profiles list --age-group senior

# Filter by age range
insighta profiles list --min-age 25 --max-age 40
insighta profiles list --min-age 18

# Sorting
insighta profiles list --sort-by age --order desc
insighta profiles list --sort-by name --order asc

# Pagination
insighta profiles list --page 2 --limit 20

# Combine multiple filters
insighta profiles list --gender male --country NG --age-group adult --sort-by age --order desc
```

**Available Filters**:
- `--gender`: `male` or `female`
- `--country`: ISO 3166-1 alpha-2 country code (e.g., NG, US, GB)
- `--age-group`: `child`, `youth`, `adult`, `senior`
- `--min-age`: Minimum age (number)
- `--max-age`: Maximum age (number)
- `--sort-by`: Field to sort by (e.g., `age`, `name`, `country`)
- `--order`: Sort order (`asc` or `desc`)
- `--page`: Page number (default: 1)
- `--limit`: Results per page (default: 10)

**Output Example**:
```
┌────┬──────────────────┬─────┬────────┬─────────┬───────────────┐
│ ID │ Name             │ Age │ Gender │ Country │ Age Group     │
├────┼──────────────────┼─────┼────────┼─────────┼───────────────┤
│ 1  │ John Doe         │ 28  │ male   │ NG      │ adult         │
│ 2  │ Jane Smith       │ 35  │ female │ US      │ adult         │
│ 3  │ Ahmed Hassan     │ 42  │ male   │ EG      │ adult         │
└────┴──────────────────┴─────┴────────┴─────────┴───────────────┘

Page 1 of 5 (Total: 50 profiles)

[n] Next Page  [p] Previous Page  [q] Quit  [1-5] Jump to Page
```

---

#### Get Profile by ID

Retrieve detailed information for a specific profile:

```bash
insighta profiles get <id>

# Example
insighta profiles get 42
```

**Output**:
```
┌──────────────┬─────────────────────────────┐
│ Field        │ Value                       │
├──────────────┼─────────────────────────────┤
│ ID           │ 42                          │
│ Name         │ John Doe                    │
│ Age          │ 28                          │
│ Gender       │ male                        │
│ Country      │ Nigeria (NG)                │
│ Age Group    │ adult                       │
│ Created At   │ 2026-01-15T10:30:00.000Z    │
│ Updated At   │ 2026-04-20T14:22:00.000Z    │
└──────────────┴─────────────────────────────┘
```

---

#### Search Profiles

Search profiles using natural language queries:

```bash
insighta profiles search "your search query"

# Examples
insighta profiles search "young males from nigeria"
insighta profiles search "adult females"
insighta profiles search "people over 50 from united states"
insighta profiles search "children from egypt"
```

**Natural Language Processing**:
The search command intelligently parses queries to extract:
- **Gender keywords**: male, female, man, woman, boy, girl
- **Age-related terms**: young, old, adult, child, senior, teenager
- **Country names**: Full names or ISO codes (Nigeria, US, Egypt, GB)
- **Age numbers**: Specific ages or ranges ("over 50", "under 30")

**Output**: Same table format as `profiles list` with results matching the query.

---

#### Create Profile

Create a new profile (admin only):

```bash
insighta profiles create --name "Full Name"

# Example
insighta profiles create --name "Harriet Tubman"
```

**Behavior**:
1. Validates user has admin role
2. Classifies profile using backend AI service
3. Determines age, gender, country, age group
4. Returns created profile with ID

**Output**:
```
✓ Profile created successfully!

┌──────────────┬─────────────────────────────┐
│ Field        │ Value                       │
├──────────────┼─────────────────────────────┤
│ ID           │ 123                         │
│ Name         │ Harriet Tubman              │
│ Age          │ 45                          │
│ Gender       │ female                      │
│ Country      │ US                          │
│ Age Group    │ adult                       │
└──────────────┴─────────────────────────────┘
```

---

#### Export Profiles

Export profiles to CSV format:

```bash
# Export all profiles
insighta profiles export --format csv

# Export with filters
insighta profiles export --format csv --gender male
insighta profiles export --format csv --country NG
insighta profiles export --format csv --gender female --country US
```

**Behavior**:
1. Fetches profiles based on filters
2. Receives CSV data from backend
3. Saves to current working directory
4. Filename format: `profiles_YYYY-MM-DD.csv`

**Output**:
```
✓ Exported 150 profiles to profiles_2026-04-29.csv
```

**CSV Format**:
```csv
id,name,age,gender,country,age_group,created_at
1,John Doe,28,male,NG,adult,2026-01-15T10:30:00.000Z
2,Jane Smith,35,female,US,adult,2026-02-20T14:22:00.000Z
```

## Token Handling Approach

### Access Token Management

The CLI implements **automatic token refresh** for seamless user experience:

```javascript
// Simplified token handling flow
async function fetchResponse(method, urlPath, body) {
    const credentials = readCredentials()
    
    // 1. Attempt request with current access token
    const response = await fetch(url, {
        headers: {
            'Cookie': `access_token=${credentials.access_token}`
        }
    })
    
    // 2. Check if token expired
    if (response.status === 401 && response.message === 'Access Token has expired') {
        // 3. Attempt automatic refresh
        await refreshCredentials(credentials)
        
        // 4. Retry original request
        return fetchResponse(method, urlPath, body)
    }
    
    return response
}
```

### Token Refresh Flow

```
API Request
    │
    ▼
┌─────────────────────┐
│ Send with access_   │
│ token in Cookie     │
└──────────┬──────────┘
           │
           ▼
    ┌──────────┐
    │ Token    │
    │ Valid?   │
    └─┬─────┬──┘
      │     │
   Yes│     │No (401 + "Access Token has expired")
      │     │
      │     ▼
      │  ┌────────────────────────┐
      │  │ POST /auth/refresh     │
      │  │ with refresh_token     │
      │  └──────────┬─────────────┘
      │             │
      │             ▼
      │      ┌──────────────┐
      │      │ Refresh      │
      │      │ Token Valid? │
      │      └──┬────────┬──┘
      │         │        │
      │      Yes│        │No
      │         │        │
      │         ▼        ▼
      │  ┌──────────┐  ┌─────────────────┐
      │  │ Return   │  │ Delete local    │
      │  │ new      │  │ credentials     │
      │  │ tokens   │  │                 │
      │  └────┬─────┘  │ Prompt:         │
      │       │        │ "insighta login"│
      │       │        └─────────────────┘
      │       ▼
      │  ┌──────────────┐
      │  │ Save new     │
      │  │ credentials  │
      │  └──────┬───────┘
      │         │
      │         ▼
      │  ┌──────────────┐
      │  │ Retry        │
      │  │ original     │
      │  │ request      │
      │  └──────┬───────┘
      │         │
      ▼         ▼
┌────────────────────┐
│ Return response    │
│ to user            │
└────────────────────┘
```

### Token Expiry Times

| Token Type      | Expiry Time | Purpose                           |
|----------------|-------------|-----------------------------------|
| Access Token   | 3 minutes   | API authentication                |
| Refresh Token  | 5 minutes   | Obtaining new access tokens       |

### Security Measures

1. **Refresh Token Rotation**: Each refresh invalidates the old refresh token and issues a new pair
2. **Token Blacklist**: Backend maintains a Redis blacklist of invalidated tokens
3. **Secure Storage**: Tokens stored locally with appropriate file permissions
4. **Automatic Cleanup**: Expired credentials handled gracefully

## Role Enforcement Logic

### Backend Role Verification

The backend implements role-based access control (RBAC):

```javascript
// Middleware: authenticate.js
export function authenticate(req, res, next) {
    // 1. Extract access_token from Cookie
    const token = req.cookies.access_token
    
    // 2. Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 3. Check token blacklist (Redis)
    if (isBlacklisted(token)) {
        return res.status(401).json({ message: 'Token has been revoked' })
    }
    
    // 4. Attach user info to request
    req.user = decoded
    next()
}

// Middleware: adminAccess.js
export function adminAccess(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' })
    }
    next()
}
```

### Protected Endpoints

| Endpoint                | Method | Required Role |
|-------------------------|--------|---------------|
| `/api/profiles`         | GET    | authenticated |
| `/api/profiles/:id`     | GET    | authenticated |
| `/api/profiles/search`  | GET    | authenticated |
| `/api/profiles/export`  | GET    | authenticated |
| `/api/profiles`         | POST   | **admin**     |
| `/api/profiles/:id`     | PUT    | **admin**     |
| `/api/profiles/:id`     | DELETE | **admin**     |

### CLI Role Handling

The CLI receives role information during authentication and displays appropriate errors for unauthorized actions:

```bash
# Non-admin user attempts to create profile
$ insighta profiles create --name "Test User"
✗ Error: Admin access required
```

## Natural Language Parsing

### Search Query Processing

The CLI implements intelligent natural language parsing for the `profiles search` command:

```javascript
// Backend: Parse natural language query
function parseSearchQuery(queryString) {
    const filters = {}
    const words = queryString.toLowerCase().split(/\s+/)
    
    // 1. Extract gender
    const genderKeywords = {
        male: ['male', 'man', 'men', 'boy', 'boys'],
        female: ['female', 'woman', 'women', 'girl', 'girls']
    }
    
    // 2. Extract age-related terms
    const ageKeywords = {
        young: ['young', 'youth', 'teenager'],
        adult: ['adult', 'adults'],
        senior: ['senior', 'old', 'elderly']
    }
    
    // 3. Extract country names
    // Match against country database (full names and ISO codes)
    
    // 4. Extract numeric age constraints
    // "over 50", "under 30", "between 25 and 40"
    
    // 5. Build SQL WHERE clause
    return buildQueryFromFilters(filters)
}
```

### Example Queries and Parsing

| User Query                           | Extracted Filters                              |
|--------------------------------------|------------------------------------------------|
| "young males from nigeria"           | gender=male, country=NG, age_group=youth       |
| "adult females"                      | gender=female, age_group=adult                 |
| "people over 50 from united states"  | min_age=50, country=US                         |
| "children from egypt"                | age_group=child, country=EG                    |
| "senior women"                       | gender=female, age_group=senior                |

### Query Building Process

```
Natural Language Input: "young males from nigeria"
         │
         ▼
┌─────────────────────┐
│ Tokenize & Parse    │
│ - Split words       │
│ - Normalize case    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Pattern Matching    │
│ - Gender: "males"   │
│ - Age: "young"      │
│ - Country: "nigeria"│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Map to Database     │
│ Fields              │
│ - gender = 'male'   │
│ - age_group = 'youth'│
│ - country = 'NG'    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Build SQL Query     │
│ WHERE gender='male' │
│ AND age_group='youth'│
│ AND country='NG'    │
└──────────┬──────────┘
           │
           ▼
    Execute Query
```

## Technical Details

### Tech Stack

**CLI**:
- **Runtime**: Node.js (ES Modules)
- **CLI Framework**: Commander.js
- **HTTP Client**: Axios & Fetch API
- **UI Components**: 
  - `cli-table`: Structured data tables
  - `chalk`: Colored terminal output
  - Custom spinner implementation
- **Authentication**: 
  - `crypto`: PKCE implementation
  - `http`: Temporary callback server
  - `open`: Browser launching

**Backend** (stage-one):
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis (token blacklist)
- **Authentication**: 
  - `jsonwebtoken`: JWT token generation/verification
  - GitHub OAuth 2.0
- **Middleware**: Custom authentication & authorization

### File Structure

```
cli-tool/
├── index.js                    # CLI entry point, command definitions
├── package.json                # Dependencies & bin configuration
├── .env                        # Environment configuration
├── logger.js                   # Custom logging utility
├── spinner.js                  # Loading spinner utility
├── utilFunctions.js            # Shared utilities (fetch, credentials)
└── commands/
    ├── index.js                # Command exports
    ├── login.js                # OAuth PKCE login flow
    ├── logout.js               # Logout & credential cleanup
    ├── whoami.js               # User info display
    ├── getProfiles.js          # List profiles with filters
    ├── getProfilesById.js      # Get single profile
    ├── searchProfiles.js       # Natural language search
    ├── createProfiles.js       # Create new profile (admin)
    └── exportProfiles.js       # CSV export
```

### Key Dependencies

```json
{
  "axios": "^1.15.2",           // HTTP client
  "chalk": "^5.6.2",            // Terminal colors
  "cli-table": "^0.3.11",       // Data tables
  "commander": "^14.0.3",       // CLI framework
  "conf": "^15.1.0",            // Unused (consider removing)
  "dotenv": "^17.4.2",          // Environment variables
  "jsonwebtoken": "^9.0.3",     // JWT handling
  "open": "^11.0.0"             // Browser launcher
}
```

## Error Handling

### Token Expiry

```bash
# Access token expired → automatic refresh
$ insighta profiles list
⠋ Fetching data...
⠙ Refreshing authentication...
✓ Data fetched successfully

# Refresh token expired → prompt re-login
$ insighta profiles list
⚠ Refresh token has expired. Run 'insighta login' to login again.
```

### Network Errors

```bash
$ insighta profiles list
✗ Fetch failed: Network request failed
✗ Error: Unable to connect to server. Please check your internet connection.
```

### Authorization Errors

```bash
$ insighta profiles create --name "Test"
✗ Error: Admin access required
```

### Validation Errors

```bash
$ insighta profiles list --gender invalid
✗ Error: Invalid gender value. Must be 'male' or 'female'

$ insighta profiles list --country INVALID
✗ Error: Invalid country code. Must be a valid ISO 3166-1 alpha-2 code
```

### Authentication Timeout

```bash
$ insighta login
ℹ Opening browser for GitHub authorization...
✓ Browser opened successfully!
ℹ Waiting for GitHub authorization...
✗ Authentication failed: Authentication timeout
```

## Development

### Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd cli-tool

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Link for local testing
npm link

# Test commands
insighta --help
```

### Testing Authentication Locally

```bash
# Start backend server first
cd ../stage-one
npm start

# In another terminal, test CLI
cd ../cli-tool
insighta login
```

### Environment Variables for Development

```env
API_URL=http://localhost:3000
GITHUB_CLIENT_ID=your_dev_client_id
```

### Debugging

Enable debug logs by setting the log level in `logger.js`:

```javascript
// logger.js
const LOG_LEVEL = 'debug' // 'info' | 'debug' | 'error'
```

### Common Development Tasks

```bash
# Unlink global installation
npm unlink -g insighta-cli-tool

# Re-link after changes
npm link

# Clear credentials for testing
rm -rf ~/.insighta/credentials.json
```

## Troubleshooting

### Command Not Found

```bash
# Verify installation
npm list -g insighta-cli-tool

# Re-link if needed
npm link
```

### Browser Not Opening

The CLI will display the OAuth URL if it cannot open the browser automatically:

```bash
⚠ Could not open browser automatically.
ℹ Please copy and paste this URL into your browser:

https://github.com/login/oauth/authorize?client_id=...
```

### Credentials Not Saved

Check file permissions:

```bash
ls -la ~/.insighta/
# Should show credentials.json with readable permissions
```

### Backend Connection Issues

Verify backend URL in `.env`:

```bash
# Test backend health
curl http://localhost:3000/health
```

## License

ISC

## Support

For issues, questions, or contributions, please contact the development team or open an issue in the repository.

---

**Built with ❤️ by Zubbee**
