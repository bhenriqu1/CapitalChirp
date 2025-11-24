# How to Test Your Database Connection

## ⚠️ Important: Update Your .env File

Your `.env` file currently has a **placeholder** connection string. You need to replace it with your **actual Neon database connection string**.

## Steps to Test:

### 1. Get Your Real Neon Connection String

- Go to your Neon dashboard: https://console.neon.tech
- Click on your project
- Go to "Connection Details" or "Connection String"
- Copy the connection string (it should look like):
  ```
  postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
  ```

### 2. Update Your .env File

Open `.env` and replace this line:
```env
DATABASE_URL=postgresql://user:password@host/database
```

With your actual Neon connection string:
```env
DATABASE_URL=postgresql://your-actual-neon-connection-string-here
```

### 3. Test the Connection

Once you've updated the `.env` file, test it with:

```bash
npm run db:push
```

**Expected success output:**
```
✓ Pushed to database
```

**If you see errors:**
- Check that your connection string is correct
- Make sure your Neon project is active (not paused)
- Verify the connection string includes `?sslmode=require`

### 4. Alternative: Use Drizzle Studio

You can also test by opening the database viewer:

```bash
npm run db:studio
```

This opens a web interface at `http://localhost:4983` where you can see your database.

## Quick Test Commands

```bash
# Test connection and push schema
npm run db:push

# Open database viewer
npm run db:studio

# Test connection (after fixing .env)
npm run db:test
```

