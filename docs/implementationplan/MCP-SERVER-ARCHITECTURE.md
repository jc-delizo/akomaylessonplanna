# MCP Server Architecture for AKOMAYLESSONPLANNA Development

**Project:** AKOMAYLESSONPLANNA
**Purpose:** Optimize Cursor AI development with Model Context Protocol (MCP) servers
**Date:** 2025-01-10
**Status:** 📋 PLANNING

---

## Overview

**What is MCP?**
Model Context Protocol (MCP) allows Cursor AI to connect to external tools and data sources, enhancing its ability to write better code, debug issues, and interact with your development environment.

**Why Use MCP Servers?**
- Cursor AI can read your database schema directly
- Real-time error tracking from Sentry
- Execute browser commands for testing
- Access filesystem operations safely
- Run database queries during development
- Automate repetitive development tasks

**Benefits for This Project:**
1. **Faster Development**: Cursor can query database schema without you explaining it
2. **Fewer Errors**: Real-time validation against actual database structure
3. **Better Code Generation**: MCP servers provide context for accurate code
4. **Automated Testing**: Browser automation for E2E tests
5. **Debugging**: Direct access to error logs and performance metrics

---

## Recommended MCP Servers for AKOMAYLESSONPLANNA

### 1. Supabase MCP Server (CRITICAL) ⭐⭐⭐⭐⭐

**Purpose:** Direct database access, schema introspection, query execution

**Why Critical:**
- Cursor can read your 20+ database tables automatically
- Generate accurate SQL queries based on schema
- Validate TypeScript types against actual database
- Test database operations during development

**Repository:** https://github.com/supabase/mcp-supabase

**Features:**
- List all tables and columns
- Read table relationships (foreign keys)
- Execute SELECT queries (read-only)
- Show Row Level Security (RLS) policies
- Inspect database functions and triggers

**Configuration:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_PROJECT_URL": "your_supabase_project_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_supabase_service_role_key"
      }
    }
  }
}
```

**Security Note:**
- Use `service_role` key (NOT `anon` key) for full access
- Never commit `service_role` key to git
- Only use in development, not production
- Cursor will use this for read operations by default

**Use Cases:**
```
You: "Create a TypeScript type for the products table"
Cursor: [Reads schema via MCP] → Generates accurate type with all columns

You: "Write a query to get all products with seller information"
Cursor: [Checks foreign keys via MCP] → Writes JOIN query correctly

You: "Create a form to add a new product"
Cursor: [Reads required columns via MCP] → Generates form with all fields
```

---

### 2. Filesystem MCP Server (CRITICAL) ⭐⭐⭐⭐⭐

**Purpose:** Safe file operations, directory navigation, file watching

**Why Critical:**
- Built-in to Cursor, usually enabled by default
- Read/write files with proper permissions
- Search codebase efficiently
- Execute file operations safely

**Repository**: Built-in to Cursor

**Features:**
- Read file contents
- Write/create files
- List directories
- Search files by name or content
- Watch files for changes

**Configuration:**
Usually enabled by default in Cursor. If not:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\odvip\\OneDrive\\Desktop\\JC\\akomaylessonplanna"
      ]
    }
  }
}
```

**Use Cases:**
```
You: "Create a new component for product cards"
Cursor: [Navigates via MCP] → Creates file in components/ directory

You: "Find all files that use the Button component"
Cursor: [Searches via MCP] → Lists all files with Button imports

You: "Update the layout to include a navbar"
Cursor: [Reads layout.tsx via MCP] → Makes changes accurately
```

---

### 3. PostgreSQL MCP Server (HIGH PRIORITY) ⭐⭐⭐⭐

**Purpose:** Direct PostgreSQL queries, database introspection

**Why Important:**
- Alternative to Supabase MCP if you need raw SQL access
- Execute custom queries for testing
- Inspect database performance
- Manage database migrations

**Repository:** https://github.com/modelcontextprotocol/servers

**Features:**
- Execute any SQL query
- Show query execution plans
- List database tables, columns, indexes
- Inspect constraints and relationships

**Configuration:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
      ]
    }
  }
}
```

**Connection String Format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Get connection string from Supabase Dashboard:
1. Go to Project Settings → Database
2. Scroll to "Connection string"
3. Copy "URI" format
4. Replace `[YOUR-PASSWORD]` with your database password

**Use Cases:**
```
You: "Show me all users who signed up today"
Cursor: [Executes query via MCP] → Returns results

You: "Create an index on the products table for faster searches"
Cursor: [Checks schema via MCP] → Generates CREATE INDEX statement

You: "Why is this query slow?"
Cursor: [Runs EXPLAIN via MCP] → Shows query execution plan
```

---

### 4. Puppeteer MCP Server (HIGH PRIORITY) ⭐⭐⭐⭐

**Purpose:** Browser automation, E2E testing, screenshot capture

**Why Important:**
- Test checkout flows visually
- Capture screenshots for documentation
- Automate repetitive browser tasks
- Test responsive design

**Repository:** https://github.com/modelcontextprotocol/servers

**Features:**
- Launch Chrome/Chromium browser
- Navigate to URLs
- Take screenshots
- Fill forms and click buttons
- Execute JavaScript in browser
- Test mobile/responsive views

**Configuration:**
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    }
  }
}
```

**Use Cases:**
```
You: "Test the checkout flow and take screenshots"
Cursor: [Launches browser via MCP] → Navigates through checkout → Captures screenshots

You: "Verify the mobile view of the product page"
Cursor: [Sets viewport via MCP] → Opens page in mobile size → Takes screenshot

You: "Fill out the signup form and submit it"
Cursor: [Automates via MCP] → Fills fields → Submits form → Reports result
```

**Example Usage in Development:**
```typescript
// In your test files
import { mcpPuppeteer } from '@modelcontextprotocol/server-puppeteer'

// Test checkout flow
test('complete purchase flow', async () => {
  await page.goto('http://localhost:3000/products/123')
  await page.click('button[data-testid="add-to-cart"]')
  await page.click('button[data-testid="checkout"]')
  await page.fill('input[name="email"]', 'test@example.com')
  // ... more steps
  await expect(page).toHaveURL(/.*\/success/)
})
```

---

### 5. Fetch MCP Server (MEDIUM PRIORITY) ⭐⭐⭐

**Purpose:** Make HTTP requests, test APIs, fetch external resources

**Why Useful:**
- Test GCash/Maya payment APIs
- Fetch data from external services
- Test webhook endpoints
- Validate API responses

**Repository:** https://github.com/modelcontextprotocol/servers

**Features:**
- Make HTTP GET/POST/PUT/DELETE requests
- Set headers and authentication
- Inspect response headers and status
- Parse JSON responses
- Test API endpoints locally

**Configuration:**
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ]
    }
  }
}
```

**Use Cases:**
```
You: "Test the GCash payment API endpoint"
Cursor: [Makes request via MCP] → Shows response from GCash sandbox

You: "Verify the webhook is receiving requests"
Cursor: [Sends test webhook via MCP] → Confirms endpoint works

You: "Fetch the product list from the API"
Cursor: [Requests via MCP] → Returns JSON response for validation
```

---

### 6. Memory MCP Server (OPTIONAL) ⭐⭐⭐

**Purpose:** Persistent memory across Cursor sessions

**Why Useful:**
- Remember project-specific context
- Store architectural decisions
- Recall previous debugging solutions
- Maintain development history

**Repository:** https://github.com/modelcontextprotocol/servers

**Features:**
- Store key-value pairs
- Remember decisions across sessions
- Build knowledge base over time
- Recall previous conversations

**Configuration:**
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
```

**Use Cases:**
```
You: "Remember that we're using Philippine Peso for all prices"
Cursor: [Saves to memory via MCP] → Will remember in future sessions

You: "How did we fix the watermark issue last week?"
Cursor: [Recalls from memory via MCP] → Retrieves previous solution

You: "Note that GCash API requires a specific header format"
Cursor: [Stores in memory via MCP] → Will use correct format in future code
```

---

### 7. GitHub MCP Server (OPTIONAL) ⭐⭐

**Purpose:** Access GitHub repositories, issues, PRs

**Why Useful:**
- Create GitHub issues from bugs
- Check PR status
- Access repository metadata
- Manage releases

**Repository:** https://github.com/modelcontextprotocol/servers

**Features:**
- List issues and pull requests
- Create new issues
- Read file contents from GitHub
- Get repository information

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github",
        "your-github-token"
      ]
    }
  }
}
```

**Get GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select `repo` scope
4. Copy token and paste in config

**Use Cases:**
```
You: "Create a GitHub issue for this bug"
Cursor: [Uses GitHub MCP] → Creates issue with details

You: "Show me all open issues for this project"
Cursor: [Fetches via MCP] → Lists all open issues

You: "What's the status of my latest PR?"
Cursor: [Checks via MCP] → Shows PR review status
```

---

### 8. Brave Search MCP Server (OPTIONAL) ⭐⭐

**Purpose:** Web search for documentation, solutions, examples

**Why Useful:**
- Find Next.js/Supabase documentation
- Search for error solutions
- Get code examples from web
- Research best practices

**Repository:** https://github.com/modelcontextprotocol/servers

**Configuration:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key"
      }
    }
  }
}
```

**Get Brave API Key:**
1. Go to https://api.search.brave.com/app/keys
2. Sign up for free account
3. Copy API key

**Use Cases:**
```
You: "How do I implement file upload with Supabase Storage?"
Cursor: [Searches via MCP] → Finds latest Supabase docs → Explains implementation

You: "Why am I getting this Next.js error?"
Cursor: [Searches via MCP] → Finds GitHub issues with solution

You: "Show me examples of marketplace UI patterns"
Cursor: [Searches via MCP] → Finds relevant examples
```

---

## MCP Configuration Setup

### Step 1: Locate Cursor Config File

**Windows Path:**
```
C:\Users\odvip\AppData\Roaming\Cursor\User\globalStorage\mcp_settings.json
```

**Or in Cursor:**
1. Open Cursor Settings (Ctrl+,)
2. Search for "MCP"
3. Click "Open Config File"

---

### Step 2: Create MCP Configuration

**File:** `mcp_settings.json` (in Cursor config directory)

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_PROJECT_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\odvip\\OneDrive\\Desktop\\JC\\akomaylessonplanna"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    },
    "fetch": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
```

---

### Step 3: Add Environment Variables

**Create file:** `.env.mcp` (in project root, add to `.gitignore`)

```bash
# Supabase
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-database-password

# GitHub (optional)
GITHUB_TOKEN=your-github-pat

# Brave Search (optional)
BRAVE_API_KEY=your-brave-api-key
```

**Update `.gitignore`:**
```
# MCP secrets
.env.mcp
```

---

### Step 4: Restart Cursor

1. Close Cursor completely
2. Reopen Cursor
3. MCP servers will auto-start
4. Check Cursor logs for any connection errors

---

### Step 5: Verify MCP Connections

**In Cursor Chat, type:**
```
@supabase list all tables in the database
```

You should see:
- List of all tables (even if empty, after we create them)
- No connection errors

**Test Filesystem MCP:**
```
@filesystem list files in the current directory
```

You should see:
- File tree of your project

---

## MCP Usage Workflow

### Example 1: Creating a New Feature

**You:** "Create a product listing page with Supabase"

**Cursor (with MCP):**
1. **@supabase** → Reads products table schema
2. **@supabase** → Checks relationships (seller, category)
3. **@filesystem** → Creates new page file
4. Generates code with accurate types
5. **@postgres** → Tests query in database

**Result:** Production-ready code in seconds, not minutes

---

### Example 2: Debugging an Issue

**You:** "The checkout is failing with a database error"

**Cursor (with MCP):**
1. **@postgres** → Runs query to check data
2. **@supabase** → Inspects RLS policies
3. **@fetch** → Tests API endpoint
4. Identifies issue (e.g., missing RLS policy)
5. **@memory** → Stores solution for future

**Result:** Issue fixed in minutes, not hours

---

### Example 3: Testing a Flow

**You:** "Test the complete purchase flow"

**Cursor (with MCP):**
1. **@puppeteer** → Launches browser
2. Navigates to product page
3. Adds item to cart
4. Proceeds to checkout
5. Fills payment form
6. **@fetch** → Verifies payment API call
7. Takes screenshots at each step
8. Reports success/failure

**Result:** Automated E2E test without manual clicking

---

## MCP Best Practices

### Security

**✅ DO:**
- Use environment variables for sensitive keys
- Add `.env.mcp` to `.gitignore`
- Use read-only operations when possible
- Rotate keys periodically
- Use separate dev/test environment

**❌ DON'T:**
- Commit API keys to git
- Use production credentials in development
- Share MCP config publicly
- Expose service_role keys in client code

---

### Performance

**✅ DO:**
- Limit MCP server usage when not needed
- Cache frequently accessed data
- Use specific queries (not SELECT *)
- Index database columns used in searches

**❌ DON'T:**
- Query entire database tables
- Run heavy operations during development
- Keep unused MCP servers enabled

---

### Development Workflow

**Recommended Daily Routine:**

1. **Start of Day:**
   - Restart Cursor to refresh MCP connections
   - Verify all MCP servers are running
   - Test basic operations

2. **During Development:**
   - Use `@supabase` for schema questions
   - Use `@postgres` for query testing
   - Use `@filesystem` for file operations
   - Use `@memory` to store decisions

3. **End of Day:**
   - Review MCP server logs
   - Update `.env.mcp` if needed
   - Commit code (excluding MCP secrets)

---

## Troubleshooting

### Issue: MCP Server Not Connecting

**Symptoms:**
- "@server-name not recognized" error
- No response from MCP commands

**Solutions:**
1. Check Cursor config file syntax (JSON validity)
2. Verify environment variables are set
3. Restart Cursor completely
4. Check npm packages are installed: `npx -y @package/name`
5. Check Cursor logs: View → Output → MCP

---

### Issue: Supabase MCP Timeout

**Symptoms:**
- Slow responses from @supabase
- "Connection timed out" errors

**Solutions:**
1. Check internet connection
2. Verify Supabase project URL is correct
3. Check Supabase project is active (not paused)
4. Test Supabase connection: `ping your-project.supabase.co`

---

### Issue: Puppeteer MCP Not Launching Browser

**Symptoms:**
- Browser doesn't open
- "Failed to launch browser" error

**Solutions:**
1. Install Chrome/Chromium if not present
2. Check system has enough memory
3. Try headless mode in configuration
4. Update Puppeteer: `npm install -g puppeteer`

---

## MCP Server Priority

### Must Have (Critical) ⭐⭐⭐⭐⭐
1. **Filesystem MCP** - File operations
2. **Supabase MCP** - Database access

### Should Have (High Priority) ⭐⭐⭐⭐
3. **PostgreSQL MCP** - SQL queries
4. **Puppeteer MCP** - Browser automation

### Nice to Have (Medium Priority) ⭐⭐⭐
5. **Fetch MCP** - API testing
6. **Memory MCP** - Persistent context

### Optional (Low Priority) ⭐⭐
7. **GitHub MCP** - Repository management
8. **Brave Search MCP** - Web search

---

## Expected Timeline with MCP

**Without MCP:**
- Feature development: 2-4 hours
- Debugging: 1-2 hours
- Testing: 1 hour
- **Total: 4-7 hours per feature**

**With MCP:**
- Feature development: 30-60 minutes
- Debugging: 15-30 minutes
- Testing: 30 minutes (automated)
- **Total: 1.5-2 hours per feature**

**Speed Improvement: 3-4x faster** 🚀

---

## Next Steps

1. **Complete Pre-Development Checklist** (see previous doc)
2. **Set up MCP servers** using this guide
3. **Test all MCP connections** before coding
4. **Start Phase 1** with MCP-powered development
5. **Update this doc** with project-specific learnings

---

## Resources

**Official MCP Documentation:**
- MCP Specification: https://modelcontextprotocol.io
- MCP Servers: https://github.com/modelcontextprotocol/servers
- Cursor MCP Guide: https://cursor.sh/docs/mcp

**Supabase MCP:**
- Repository: https://github.com/supabase/mcp-supabase
- Documentation: https://supabase.com/docs/guides/integrations/mcp

**Community:**
- MCP Discord: https://discord.gg/modelcontextprotocol
- Cursor Discord: https://discord.gg/cursor

---

**Status:** 📋 Ready to implement
**Last Updated:** 2025-01-10
**Version:** 1.0

**Remember:** MCP servers are force multipliers for Cursor AI. Configure them once, benefit throughout development!
