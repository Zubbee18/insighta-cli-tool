# Insighta CLI Tool

Command-line interface for Insighta profile management system with GitHub OAuth authentication, automatic token refresh, and natural language search.

## Production Links

**API:** https://ubiquitous-chainsaw-production-5f71.up.railway.app/  
**Web Portal:** https://insighta-web-portal-production.up.railway.app

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Authentication Flow](#authentication-flow)
- [Token Handling](#token-handling)
- [Role Enforcement](#role-enforcement)
- [Natural Language Parsing](#natural-language-parsing)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Setup](#setup)

## Features

✅ GitHub OAuth with PKCE  
✅ Automatic token refresh  
✅ Local credential storage (`~/.insighta/credentials.json`)  
✅ Beautiful tables & spinners  
✅ Natural language search  
✅ CSV export  
✅ Comprehensive filtering

## System Architecture

**Components:**

- **CLI Client**: Node.js app using Commander.js, Axios for HTTP, local callback server for OAuth
- **Backend API**: Express.js with JWT authentication, PostgreSQL + Redis
- **GitHub OAuth**: Third-party authentication provider

**Flow:** CLI → HTTPS with access_token in Cookie → Backend API → PostgreSQL/Redis → External APIs

## Authentication Flow

**GitHub OAuth 2.0 with PKCE:**

1. User runs `insighta login`
2. CLI generates PKCE verifier + challenge, opens browser to GitHub OAuth
3. User authorizes app
4. GitHub redirects to localhost:4000 with code
5. CLI validates state, sends code + verifier to backend
6. Backend exchanges code for GitHub token, fetches user info, creates JWT tokens
7. CLI saves credentials to `~/.insighta/credentials.json`
8. Display: "Logged in as @username"

**Security:**

- PKCE prevents code interception
- State parameter prevents CSRF
- Local callback server (auto-closes after auth)
- 5-minute timeout

## Token Handling

**Dual Token Strategy:**

| Token   | Lifetime | Purpose            |
| ------- | -------- | ------------------ |
| Access  | 3 min    | API authentication |
| Refresh | 5 min    | Token renewal      |

**Auto-Refresh Flow:**

1. API request with expired access token → 401 error
2. CLI sends refresh token to `/auth/refresh`
3. Backend validates (not blacklisted), issues new token pair
4. CLI saves new credentials, retries original request
5. If refresh expired → prompt "insighta login"

**Implementation:** `utilFunctions.js` handles automatic retry with token refresh

**Security:** Token blacklist in Redis, refresh token rotation, secure local storage

## Role Enforcement

**Backend RBAC:**

- **user** (default): View/search/export profiles
- **admin**: Full access including create/update/delete

**Protected Operations:**

- `POST /api/profiles` → admin only
- `PUT /api/profiles/:id` → admin only
- `DELETE /api/profiles/:id` → admin only

**CLI Handling:** Displays "Admin access required" for unauthorized actions

## Natural Language Parsing

**Rule-based search query parsing (no AI):**

**Supported Keywords:**

- Gender: male/males/man/men, female/females/woman/women
- Age Groups: young/youth/teenager, adult/adults, senior/old/elderly, child/children
- Age Ranges: over X, under X, between X and Y
- Countries: Full names or ISO codes (resolved via country database)

**Processing:**

1. Tokenize query and normalize case
2. Pattern match for gender, age, country
3. Map to database fields
4. Build SQL WHERE clause (AND logic)

**Examples:**

- "young males from nigeria" → `gender='male' AND age_group='youth' AND country='NG'`
- "people over 50 from US" → `min_age=50 AND country='US'`
- "adult females" → `gender='female' AND age_group='adult'`

## Installation

```bash
cd cli-tool
npm install
npm link  # Makes 'insighta' command globally available
```

Verify: `insighta --version`

## CLI Usage

### Authentication

```bash
insighta login                    # OAuth login
insighta whoami                   # Current user info
insighta logout                   # Clear credentials
```

### Profile Commands

```bash
# List profiles (paginated)
insighta get-profiles
insighta get-profiles --gender male --country NG --page 2

# Search with natural language
insighta search-profiles "adult males from kenya"
insighta search-profiles "young females" --page 1 --limit 20

# Get by ID
insighta get-profiles-by-id <UUID>

# Create (admin only)
insighta create-profiles --name "John Doe"

# Export to CSV
insighta export-profiles --format csv --gender female
```

### Filter Options

```bash
--gender male|female
--country_id NG|US|GB|etc        # ISO 3166-1 alpha-2
--age-group child|youth|adult|senior
--min-age 18
--max-age 60
--sort-by age|name|created_at
--order asc|desc
--page 2
--limit 20
```

### Command Examples

```bash
# Complex filtering
insighta get-profiles --gender male --country NG --age-group adult --sort-by age --order desc

# Natural language queries
insighta search-profiles "senior women from egypt"
insighta search-profiles "people under 30"

# CSV export with filters
insighta export-profiles --format csv --gender male --country US --min-age 25 --max-age 40
```

## Setup

### Prerequisites

Node.js 16+, Backend API running

### Configuration

Create `.env`:

```env
API_URL=https://your-backend-url.com
GITHUB_CLIENT_ID=your_github_client_id
```

### Credentials Storage

Automatically created at:

- Linux/macOS: `~/.insighta/credentials.json`
- Windows: `%USERPROFILE%\.insighta\credentials.json`

Format:

```json
{
  "username": "github-username",
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc..."
}
```

### Development

```bash
# Setup
git clone <repo-url>
cd cli-tool
npm install
npm link

# Test
insighta --help
insighta login

# Unlink
npm unlink -g insighta-cli-tool
```

## Tech Stack

**CLI:** Node.js, Commander.js, Axios, cli-table3, chalk, open (browser)  
**Auth:** PKCE implementation with crypto, temporary HTTP server  
**Backend:** Express.js, PostgreSQL, Redis, JWT, GitHub OAuth

## Error Handling

```bash
# Auto-refresh expired tokens
$ insighta get-profiles
⠋ Refreshing authentication...
✓ Success

# Prompt re-login when refresh expired
$ insighta get-profiles
⚠ Refresh token expired. Run 'insighta login' to login again.

# Network errors
✗ Unable to connect to server. Check your connection.

# Authorization errors
✗ Admin access required

# Validation errors
✗ Invalid gender value. Must be 'male' or 'female'
```

## Troubleshooting

**Command not found:**

```bash
npm list -g insighta-cli-tool
npm link
```

**Browser not opening:** CLI displays URL to copy manually

**Backend connection:** Verify `API_URL` in `.env`

**Clear credentials:**

```bash
rm -rf ~/.insighta/credentials.json
```

## File Structure

```
cli-tool/
├── index.js              # CLI entry point
├── package.json          # Dependencies
├── logger.js             # Logging utility
├── spinner.js            # Loading spinner
├── utilFunctions.js      # Fetch & credentials
└── commands/
    ├── login.js          # OAuth flow
    ├── logout.js         # Cleanup
    ├── whoami.js         # User info
    ├── getProfiles.js    # List profiles
    ├── getProfilesById.js
    ├── searchProfiles.js # Natural language
    ├── createProfiles.js # Admin only
    └── exportProfiles.js # CSV export
```

---

**Built with ❤️ by Zubbee**
