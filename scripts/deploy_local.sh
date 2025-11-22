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

# Deploy vault canister
echo "📦 Deploying vault canister..."
cd canisters/vault
dfx deploy vault --network local
cd ../..

# Deploy indexer stub canister
echo "📦 Deploying indexer_stub canister..."
cd canisters/indexer_stub
dfx deploy indexer_stub --network local
cd ../..

# Deploy governance canister
echo "📦 Deploying governance canister..."
cd canisters/governance
dfx deploy governance --network local
cd ../..

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy frontend canister
echo "📦 Deploying frontend canister..."
cd canisters/frontend_canister
dfx deploy frontend_canister --network local
cd ../..

echo "✅ All canisters deployed successfully!"
echo ""
echo "🌐 Frontend URL: http://localhost:4943"
echo "📊 Canister IDs:"
dfx canister id vault --network local
dfx canister id indexer_stub --network local
dfx canister id governance --network local
dfx canister id frontend_canister --network local

