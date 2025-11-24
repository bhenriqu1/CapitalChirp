# Database Setup Guide

## Step 1: Create a Neon Postgres Database

1. **Sign up for Neon** (if you don't have an account):
   - Go to [https://neon.tech](https://neon.tech)
   - Click "Sign Up" and create a free account
   - You can use GitHub, Google, or email to sign up

2. **Create a new project**:
   - Once logged in, click "Create Project"
   - Choose a project name (e.g., "social-stock")
   - Select a region closest to you
   - Choose PostgreSQL version (latest is fine)
   - Click "Create Project"

3. **Get your connection string**:
   - After the project is created, you'll see a connection string
   - It looks like: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`
   - **Copy this connection string** - you'll need it in the next step
   - ⚠️ **Note**: You don't need to enable Neon's built-in authentication - Clerk handles all user auth for this project

## Step 2: Configure Your .env File

1. **Open your `.env` file** in the project root:
   ```bash
   # You can edit it with any text editor, or use:
   nano .env
   # or
   code .env
   ```

2. **Replace the DATABASE_URL placeholder** with your actual Neon connection string:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
   
   ⚠️ **Important**: Replace the entire placeholder line with your actual connection string from Neon.

## Step 3: Push the Database Schema

1. **Run the database migration** to create all tables:
   ```bash
   npm run db:push
   ```

2. **Verify it worked**:
   - You should see output like "✓ Pushed to database" or similar
   - If you see errors, check that your DATABASE_URL is correct

## Step 4: (Optional) View Your Database

You can use Drizzle Studio to view and manage your database:

```bash
npm run db:studio
```

This will open a web interface at `http://localhost:4983` where you can:
- View all tables
- Browse data
- Run queries
- Edit records

## Troubleshooting

### Error: "Either connection 'url' or 'host', 'database' are required"
- **Solution**: Make sure your `.env` file has `DATABASE_URL` set correctly
- Check that there are no extra spaces or quotes around the connection string

### Error: "Connection refused" or "Cannot connect"
- **Solution**: 
  - Verify your connection string is correct
  - Make sure your Neon project is active (not paused)
  - Check if your IP needs to be whitelisted (usually not needed for Neon)

### Error: "SSL connection required"
- **Solution**: Make sure your connection string includes `?sslmode=require` at the end

## Alternative: Using a Different Database

If you prefer to use a different PostgreSQL provider:

- **Supabase**: Similar setup, get connection string from project settings
- **Railway**: Create a PostgreSQL service, get connection string from variables
- **Local PostgreSQL**: Use `postgresql://user:password@localhost:5432/dbname`

Just replace the `DATABASE_URL` in your `.env` file with the appropriate connection string.

