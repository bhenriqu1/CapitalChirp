# Environment Variables Setup Guide

## ✅ Required Variables (Must Have)

### 1. DATABASE_URL ✅
**Status**: You have this set!
```
DATABASE_URL=postgresql://neondb_owner:...@ep-empty-silence-...
```
This is your Neon database connection string. **You're good here!**

### 2. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ⚠️
**Status**: Still needs to be set (currently: `pk_test_...`)

**How to get it:**
1. Go to [clerk.com](https://clerk.com) and sign up/login
2. Create a new application (or use existing)
3. Go to **API Keys** in the dashboard
4. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
5. Replace `pk_test_...` in your `.env` file

### 3. CLERK_SECRET_KEY ⚠️
**Status**: Still needs to be set (currently: `sk_test_...`)

**How to get it:**
1. In the same Clerk dashboard
2. Copy the **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Replace `sk_test_...` in your `.env` file

### 4. OPENAI_API_KEY ✅
**Status**: You have this set!
```
OPENAI_API_KEY=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
```
**You're good here!**

---

## ⚙️ Optional Variables (Nice to Have)

### 5. WEBHOOK_SECRET ⚠️
**Status**: Optional but recommended (currently: `whsec_...`)

**What it's for**: Allows Clerk to sync user data automatically via webhooks

**How to get it:**
1. In Clerk dashboard, go to **Webhooks**
2. Create a new webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Copy the **Signing Secret** (starts with `whsec_`)
4. Replace `whsec_...` in your `.env` file

**Note**: Only needed if you want automatic user sync. You can skip this for now if you're just testing locally.

### 6. RAPIDAPI_YAHOO_FINANCE_KEY
**Status**: Optional

**What it's for**: Real-time market data for trending tickers

**How to get it:**
1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to "Yahoo Finance" API
3. Copy your API key
4. Add it to `.env`

**Note**: The app will work without this, but market data features won't work.

### 7. AI_PIPELINE_URL
**Status**: Optional (defaults to `http://localhost:8000`)

**What it's for**: If you're running the Python AI pipeline as a separate service

**Note**: The app uses OpenAI directly, so this is only needed if you want to use the separate FastAPI service.

---

## 📋 Quick Checklist

- [x] DATABASE_URL - ✅ Set
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - ⚠️ Need to set
- [ ] CLERK_SECRET_KEY - ⚠️ Need to set
- [x] OPENAI_API_KEY - ✅ Set
- [ ] WEBHOOK_SECRET - Optional (can skip for now)
- [ ] RAPIDAPI_YAHOO_FINANCE_KEY - Optional
- [ ] AI_PIPELINE_URL - Optional

---

## 🚀 Minimum Setup to Run

To get the app running, you need:
1. ✅ DATABASE_URL (you have it!)
2. ⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (get from Clerk)
3. ⚠️ CLERK_SECRET_KEY (get from Clerk)
4. ✅ OPENAI_API_KEY (you have it!)

Everything else is optional and can be added later.

---

## 🔗 Quick Links

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Neon Dashboard**: https://console.neon.tech
- **OpenAI Dashboard**: https://platform.openai.com/api-keys
- **RapidAPI**: https://rapidapi.com (optional)

