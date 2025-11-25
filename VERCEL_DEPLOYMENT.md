# Vercel Deployment Checklist

## Required Environment Variables

Make sure these are set in Vercel (Settings → Environment Variables):

### Required for Build:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Must be set for Production, Preview, and Development
- `CLERK_SECRET_KEY` - Required for authentication
- `DATABASE_URL` - Neon Postgres connection string

### Optional (but recommended):
- `OPENAI_API_KEY` - For AI features (post analysis, feed ranking)

## After Deployment

1. **Database Migration**: Run this locally or via a script:
   ```bash
   npm run db:push
   ```
   This will create the new `self_investments` table.

2. **Verify Environment Variables**: 
   - Check that all variables are set for the correct environments
   - Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is available during build time

## Common Build Errors

### Error: Missing publishableKey
- **Fix**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel environment variables

### Error: Cannot find module
- **Fix**: This usually means dependencies need to be reinstalled. Vercel should handle this automatically, but if it persists, check `package.json` is committed.

### Error: Database connection failed
- **Fix**: Verify `DATABASE_URL` is correct and the database is accessible from Vercel's IP

## Build Configuration

The project uses:
- **Node.js**: 18+ (Vercel auto-detects)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

No special Vercel configuration needed - it should work out of the box!

