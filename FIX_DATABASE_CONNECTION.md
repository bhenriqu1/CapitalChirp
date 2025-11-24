# Fix Database Connection Issues

## The Problem

You're getting errors like:
```
could not parse the HTTP request body: data did not match any variant of untagged enum Payload
```

This happens because your connection string uses a **pooler endpoint** (`-pooler`), which can have compatibility issues with the Neon serverless driver.

## Solution: Use Direct Connection String

### Step 1: Get Your Direct Connection String

1. Go to your Neon dashboard: https://console.neon.tech
2. Click on your project
3. Go to **Connection Details** or **Settings**
4. Look for **Connection string** section
5. You'll see two options:
   - **Pooled connection** (has `-pooler` in URL) - ❌ This is what you're using now
   - **Direct connection** (no `-pooler`) - ✅ Use this one

### Step 2: Update Your .env File

Replace your current `DATABASE_URL` with the **direct connection string** (without `-pooler`).

**Current (pooler - causing issues):**
```
DATABASE_URL=postgresql://...@ep-xxx-xxx-pooler.region.aws.neon.tech/...
```

**Should be (direct - works better):**
```
DATABASE_URL=postgresql://...@ep-xxx-xxx.region.aws.neon.tech/...
```

### Step 3: Remove channel_binding

Make sure your connection string doesn't have `channel_binding=require`. The code will automatically remove it, but you can also remove it manually:

**Before:**
```
DATABASE_URL=postgresql://...?sslmode=require&channel_binding=require
```

**After:**
```
DATABASE_URL=postgresql://...?sslmode=require
```

### Step 4: Restart Your Dev Server

After updating `.env`:
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Alternative: If Direct Connection Doesn't Work

If you still have issues, you can try using the HTTP connection method. Update `lib/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
```

But first, try the direct connection string - that usually fixes it!

## Quick Check

To verify your connection string format:
```bash
grep DATABASE_URL .env
```

It should:
- ✅ NOT have `-pooler` in the URL
- ✅ NOT have `channel_binding=require`
- ✅ Have `?sslmode=require` at the end

