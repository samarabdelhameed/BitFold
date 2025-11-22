#!/usr/bin/env bash
set -e
echo "🧪 Starting local replica..."
dfx start --background --clean
echo "🔨 Deploying canisters..."
dfx deploy
echo "📦 Building frontend..."
npm --prefix frontend install
npm --prefix frontend run build
echo "✅ Done! Open: http://localhost:4943?canisterId=$(dfx canister id frontend)"
