# BitFold Project Structure

This document provides an overview of the BitFold project structure.

## Directory Structure

```
BitFold/
├── README.md                 # Project description
├── LICENSE                   # MIT License
├── .gitignore               # Git ignore rules
├── dfx.json                 # DFX configuration
│
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
│
├── docs/                     # Documentation
│   ├── design.md
│   ├── system-architecture.md
│   ├── api-reference.md
│   ├── ordinals-flow.md
│   ├── ckbtc-integration.md
│   ├── security-model.md
│   └── roadmap.md
│
├── canisters/               # Internet Computer canisters
│   ├── vault/               # Main vault canister (Rust)
│   ├── frontend_canister/   # Frontend assets canister
│   ├── indexer_stub/        # Mock Ordinals indexer
│   └── governance/          # Governance canister
│
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── utils/          # Utilities
│   │   └── styles/         # CSS styles
│   └── package.json
│
├── scripts/                  # Deployment scripts
│   ├── deploy_local.sh
│   ├── deploy_testnet.sh
│   └── generate_types.sh
│
├── test/                     # Test files
│   ├── vault_tests.rs
│   ├── integration_tests.rs
│   └── ordinals_tests.rs
│
└── demo/                     # Demo materials
    ├── demo-script.md
    ├── README.md
    └── screenshots/
```

## Key Components

### Vault Canister
The core smart contract that handles:
- UTXO deposits
- Loan creation and management
- ckBTC minting/burning
- Collateral management

### Frontend
React-based web interface with:
- Landing page
- Deposit/Borrow/Repay/Withdraw pages
- Loan dashboard
- Ordinal NFT preview

### Documentation
Comprehensive documentation covering:
- System design
- API reference
- Security model
- Integration guides

## Getting Started

See the main [README.md](./README.md) for setup instructions.

