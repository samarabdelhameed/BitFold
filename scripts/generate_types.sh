#!/bin/bash

# Generate TypeScript types from Candid interfaces

set -e

echo "🔧 Generating TypeScript types from Candid files..."

# Check if didc is installed
if ! command -v didc &> /dev/null; then
    echo "⚠️  didc is not installed. Installing..."
    cargo install didc
fi

# Generate types for vault
if [ -f "canisters/vault/src/vault.did" ]; then
    echo "📝 Generating types for vault..."
    didc bind canisters/vault/src/vault.did -t ts > frontend/src/types/vault.did.ts
fi

# Generate types for indexer_stub
if [ -f "canisters/indexer_stub/src/indexer_stub.did" ]; then
    echo "📝 Generating types for indexer_stub..."
    didc bind canisters/indexer_stub/src/indexer_stub.did -t ts > frontend/src/types/indexer_stub.did.ts
fi

# Generate types for governance
if [ -f "canisters/governance/src/governance.did" ]; then
    echo "📝 Generating types for governance..."
    didc bind canisters/governance/src/governance.did -t ts > frontend/src/types/governance.did.ts
fi

echo "✅ Type generation complete!"

