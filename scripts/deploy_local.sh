#!/bin/bash

# Deploy all canisters locally

set -e

echo "🚀 Deploying BitFold canisters locally..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install the DFX SDK first."
    exit 1
fi

# Start local replica if not running
if ! dfx ping local 2>/dev/null; then
    echo "📦 Starting local Internet Computer replica..."
    dfx start --background
    sleep 5
fi

# Build and deploy vault canister
echo "📦 Building and deploying vault canister..."
dfx build vault --network local
dfx deploy vault --network local

# Build and deploy indexer stub canister
echo "📦 Building and deploying indexer_stub canister..."
dfx build indexer_stub --network local
dfx deploy indexer_stub --network local

# Build frontend
echo "📦 Building frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run build
cd ..

# Deploy frontend canister
echo "📦 Deploying frontend canister..."
dfx deploy frontend --network local

echo "✅ All canisters deployed successfully!"
echo ""
echo "🌐 Frontend URL: http://localhost:4943"
echo "📊 Canister IDs:"
dfx canister id vault --network local
dfx canister id indexer_stub --network local
dfx canister id frontend --network local

