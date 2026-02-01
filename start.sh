#!/bin/bash

echo "Starting Agora Web Development Server..."
echo "=================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo ""
echo "Starting Next.js dev server..."
echo "The app will be available at http://localhost:3000"
echo ""

npm run dev