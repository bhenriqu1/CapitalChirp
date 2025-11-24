#!/bin/bash

echo "🚀 Setting up CapitalChirp Platform..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your API keys!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set in .env. Please add it before running migrations."
else
  echo "🗄️  Pushing database schema..."
  npm run db:push
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys"
echo "2. Run 'npm run db:push' to set up the database"
echo "3. Run 'npm run dev' to start the development server"

