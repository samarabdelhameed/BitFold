# BitFold 🚀

**BitFold** is a revolutionary decentralized lending platform that enables Bitcoin holders to unlock liquidity from their Bitcoin UTXOs and Ordinals NFTs without selling their assets. Built on the Internet Computer Protocol, BitFold allows users to use their Bitcoin as collateral to borrow ckBTC (Chain-Key Bitcoin) seamlessly and securely.

## 🎯 Project Vision

BitFold bridges the gap between Bitcoin's store of value and DeFi liquidity, enabling Bitcoin holders to:

- **Maintain ownership** of their Bitcoin while accessing liquidity
- **Leverage Ordinals NFTs** as collateral for the first time
- **Borrow ckBTC** with competitive rates and flexible terms
- **Experience true decentralization** on the Internet Computer

## 💡 Problem Statement

Bitcoin holders face a fundamental dilemma: they want to access liquidity from their Bitcoin holdings, but selling means losing their position in the market. Traditional lending solutions are either:

- Centralized and require KYC
- Limited to specific jurisdictions
- Don't support Ordinals NFTs
- Have high barriers to entry

BitFold solves this by providing a **fully decentralized, permissionless** lending platform that works globally.

## Overview

BitFold allows users to:

- Deposit Bitcoin UTXOs (including Ordinals NFTs) as collateral
- Borrow ckBTC against their collateral
- Repay loans and withdraw collateral
- Manage loans through a user-friendly web interface

## Technical Architecture

### System Components

BitFold is built on the Internet Computer Protocol (ICP) and consists of the following core components:

#### 1. Vault Canister (Core Smart Contract)

- **Language**: Rust
- **Purpose**: Manages all loan and collateral logic
- **Key Responsibilities**:
  - UTXO deposit and verification
  - Loan creation and management
  - ckBTC minting and burning operations
  - Collateral locking and unlocking
  - Ordinals NFT verification and handling
- **Modules**:
  - `lib.rs`: Main entry point and orchestration
  - `state.rs`: Persistent state management
  - `types.rs`: Data structures (Loan, UTXO, etc.)
  - `api.rs`: Public update/query methods
  - `bitcoin.rs`: Bitcoin API integration
  - `ckbtc.rs`: ckBTC minting and transfers
  - `ordinals.rs`: Ordinals indexer integration
  - `helpers.rs`: Utility functions

#### 2. Frontend Application

- **Framework**: React + Vite + TypeScript
- **Technology Stack**:
  - React for UI components
  - Vite for build tooling
  - TypeScript for type safety
  - Internet Computer Agent SDK for canister communication
  - Tailwind CSS for styling
- **Pages**:
  - Landing page
  - Deposit UTXO
  - Loan Dashboard
  - Borrow
  - Repay
  - Withdraw

#### 3. Frontend Canister

- **Type**: Assets canister
- **Purpose**: Serves static web assets on the Internet Computer

#### 4. Indexer Stub

- **Purpose**: Mock Ordinals indexer for testing and development
- **Note**: Replace with production Ordinals indexer in production environment

#### 5. Governance Canister

- **Purpose**: Manages platform parameters
- **Responsibilities**:
  - Loan-to-Value (LTV) ratio configuration
  - Interest rate policies
  - Collateral valuation rules
  - Platform governance decisions

### Integration Points

BitFold integrates with several external systems:

1. **Bitcoin Network**: UTXO verification and validation
2. **ckBTC Ledger**: Minting and burning of ckBTC tokens
3. **Ordinals Indexer**: Verification of Bitcoin Ordinals NFTs
4. **Internet Computer**: Canister execution and state management

### Data Flow

1. **Deposit Flow**: User deposits UTXO → Vault verifies via Bitcoin API → Collateral locked
2. **Borrow Flow**: User requests loan → Vault validates LTV → Vault mints ckBTC → User receives ckBTC
3. **Repay Flow**: User transfers ckBTC → Vault burns ckBTC → Loan balance updated
4. **Withdraw Flow**: User requests withdrawal → Vault verifies loan repayment → Collateral released

## Getting Started

### Prerequisites

- **DFX SDK**: Internet Computer development environment ([Installation Guide](https://internetcomputer.org/docs/current/developer-docs/setup/install/))
- **Node.js**: Version 18+ and npm
- **Rust Toolchain**: Latest stable version ([Installation Guide](https://www.rust-lang.org/tools/install))
- **Internet Identity**: For authentication on Internet Computer

### Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd BitFold
```

2. **Install DFX SDK** (if not already installed):

```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

3. **Start local Internet Computer replica**:

```bash
dfx start --background
```

4. **Deploy canisters locally**:

```bash
./scripts/deploy_local.sh
```

5. **Install frontend dependencies**:

```bash
cd frontend
npm install
```

6. **Start frontend development server**:

```bash
npm run dev
```

### Configuration

Before deploying, configure the following in `dfx.json`:

- ckBTC Ledger Canister ID (for mainnet/testnet)
- Bitcoin API endpoints
- Ordinals Indexer endpoints
- Governance Canister ID

## Development

### Project Structure

```
BitFold/
├── canisters/              # Internet Computer canisters
│   ├── vault/             # Main vault canister (Rust)
│   ├── frontend_canister/ # Frontend assets canister
│   ├── indexer_stub/      # Mock Ordinals indexer
│   └── governance/        # Governance canister
├── frontend/              # React + Vite frontend
├── docs/                  # Documentation
├── scripts/               # Deployment scripts
└── test/                  # Test files
```

### Building

**Build canisters**:

```bash
dfx build
```

**Build frontend**:

```bash
cd frontend
npm run build
```

### Testing

**Run unit tests**:

```bash
cargo test --manifest-path canisters/vault/Cargo.toml
```

**Run integration tests**:

```bash
./scripts/run_tests.sh
```

### Deployment

**Deploy to local network**:

```bash
./scripts/deploy_local.sh
```

**Deploy to testnet**:

```bash
./scripts/deploy_testnet.sh
```

## API Reference

### Vault Canister Methods

#### Update Methods

- `deposit_utxo(utxo, ordinal_info?)`: Deposit a Bitcoin UTXO as collateral
- `borrow(utxo_id, amount)`: Borrow ckBTC against deposited collateral
- `repay(loan_id, amount)`: Repay a portion or full amount of a loan
- `withdraw_collateral(utxo_id)`: Withdraw collateral after full loan repayment

#### Query Methods

- `get_user_loans(user_id)`: Get all loans for a user
- `get_collateral(user_id)`: Get all collateral for a user
- `get_loan(loan_id)`: Get details of a specific loan
- `get_utxo(utxo_id)`: Get details of a specific UTXO

For detailed API documentation, see [API Reference](./docs/api-reference.md).

## Documentation

Comprehensive documentation is available in the [docs/](./docs/) directory:

### Core Documentation

- [Design Document](./docs/design.md) - High-level design and concepts
- [System Architecture](./docs/system-architecture.md) - Detailed system architecture
- [API Reference](./docs/api-reference.md) - Complete API documentation

### Integration Guides

- [ckBTC Integration](./docs/ckbtc-integration.md) - ckBTC minting and burning
- [Ordinals Flow](./docs/ordinals-flow.md) - Ordinals NFT handling

### Visual Documentation

- [Integration Flowchart](./docs/integration-flowchart.md) - System integration diagrams
- [Use Case Flowchart](./docs/use-case-flowchart.md) - User interaction flows

### Security & Planning

- [Security Model](./docs/security-model.md) - Security considerations and best practices
- [Roadmap](./docs/roadmap.md) - Future development plans

## Key Features

### Collateral Management

- Support for standard Bitcoin UTXOs
- Support for Bitcoin Ordinals NFTs
- Individual UTXO tracking
- Collateral valuation and LTV calculation

### Loan Management

- Flexible borrowing against collateral
- Configurable LTV ratios
- Interest rate management
- Partial and full repayment support

### Security

- UTXO verification via Bitcoin API
- Ordinals verification via indexer
- Secure ckBTC minting and burning
- Access control and authentication

## Technology Stack

- **Backend**: Rust (Internet Computer Canisters)
- **Frontend**: React, TypeScript, Vite
- **Blockchain**: Internet Computer Protocol (ICP)
- **Bitcoin Integration**: Bitcoin Network API
- **Token Standard**: ICRC-1 (ckBTC)
- **Styling**: Tailwind CSS

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

For questions, issues, or contributions, please open an issue on the repository.
