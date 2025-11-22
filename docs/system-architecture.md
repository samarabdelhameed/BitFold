# System Architecture

## Overview

BitFold is built on the Internet Computer Protocol (ICP) and integrates with Bitcoin and ckBTC.

## Components

### 1. Vault Canister (Core)
- **Language**: Rust
- **Purpose**: Manages all loan and collateral logic
- **Key Modules**:
  - `lib.rs`: Main entry point and orchestration
  - `state.rs`: Persistent state management
  - `types.rs`: Data structures (Loan, UTXO, etc.)
  - `api.rs`: Public update/query methods
  - `bitcoin.rs`: Bitcoin API integration
  - `ckbtc.rs`: ckBTC minting and transfers
  - `ordinals.rs`: Ordinals indexer integration
  - `helpers.rs`: Utility functions

### 2. Frontend Canister
- **Purpose**: Serves static web assets
- **Technology**: HTML/CSS/JS assets

### 3. Frontend Application
- **Framework**: React + Vite
- **Pages**:
  - Landing page
  - Deposit UTXO
  - Loan Dashboard
  - Borrow
  - Repay
  - Withdraw
- **Components**: Reusable UI components
- **Utils**: Agent setup, formatting helpers

### 4. Indexer Stub
- **Purpose**: Mock Ordinals indexer for testing
- **Note**: Replace with real indexer in production

### 5. Governance Canister (Optional)
- **Purpose**: Manage LTV ratios, interest rates, policies

## Data Flow

1. User deposits UTXO → Vault verifies via Bitcoin API
2. User borrows → Vault mints ckBTC
3. User repays → Vault burns ckBTC
4. User withdraws → Collateral released

## Integration Points

- **Bitcoin Network**: UTXO verification
- **ckBTC Ledger**: Minting and burning
- **Ordinals Indexer**: NFT verification
- **Internet Computer**: Canister execution

