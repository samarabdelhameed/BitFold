#!/bin/bash

# Deploy all canisters to testnet

set -e

echo "🚀 Deploying BitFold canisters to testnet..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install the DFX SDK first."
    exit 1
fi

# Check if logged in
if ! dfx identity whoami &> /dev/null; then
    echo "❌ Not logged in. Please run: dfx identity new <name> or dfx identity use <name>"
    exit 1
fi

# Deploy vault canister
echo "📦 Deploying vault canister..."
cd canisters/vault
dfx deploy vault --network ic
cd ../..

# Deploy indexer stub canister
echo "📦 Deploying indexer_stub canister..."
cd canisters/indexer_stub
dfx deploy indexer_stub --network ic
cd ../..

# Deploy governance canister
echo "📦 Deploying governance canister..."
cd canisters/governance
dfx deploy governance --network ic
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
dfx deploy frontend_canister --network ic
cd ../..

echo "✅ All canisters deployed to testnet successfully!"
echo ""
echo "📊 Canister IDs:"
dfx canister id vault --network ic
dfx canister id indexer_stub --network ic
dfx canister id governance --network ic
dfx canister id frontend_canister --network ic

