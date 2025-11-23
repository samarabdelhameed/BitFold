# Requirements Document - BitFold Testnet Deployment

## Introduction

This document specifies the requirements for deploying the BitFold Vault system to ICP testnet and integrating it with Bitcoin testnet, ckBTC testnet, and Maestro Ordinals API. The deployment process includes setting up identities, obtaining cycles, configuring API keys, and testing the complete system with real testnet resources.

## Glossary

- **dfx**: The DFINITY command-line tool for managing ICP canisters
- **Identity**: A cryptographic identity used to interact with ICP
- **Principal**: A unique identifier for an identity or canister on ICP
- **Cycles**: The computational resource unit on ICP (similar to gas on Ethereum)
- **Cycles Wallet**: A canister that holds and manages cycles for deployment
- **ICP Testnet**: The Internet Computer test network (also called "playground")
- **Bitcoin Testnet**: The Bitcoin test network for development and testing
- **ckBTC Testnet**: The test version of Chain-Key Bitcoin on ICP
- **Maestro API**: An API service for querying Bitcoin Ordinals inscriptions
- **UTXO**: Unspent Transaction Output on the Bitcoin network
- **Faucet**: A service that provides free testnet tokens for development

## Requirements

### Requirement 1: ICP Identity Management

**User Story:** As a developer, I want to create and manage ICP identities, so that I can deploy canisters to the testnet.

#### Acceptance Criteria

1. WHEN creating a new identity, THE dfx tool SHALL generate a new cryptographic keypair
2. WHEN switching identities, THE dfx tool SHALL use the selected identity for all operations
3. WHEN querying the principal, THE dfx tool SHALL return the principal ID for the current identity
4. WHEN listing identities, THE dfx tool SHALL show all available identities
5. WHEN an identity is selected, THE dfx tool SHALL persist the selection across sessions

### Requirement 2: Cycles Acquisition

**User Story:** As a developer, I want to obtain free cycles from the ICP faucet, so that I can deploy canisters without spending real tokens.

#### Acceptance Criteria

1. WHEN requesting cycles from the faucet, THE faucet SHALL require Internet Identity authentication
2. WHEN cycles are granted, THE faucet SHALL transfer 20 trillion cycles to the user's account
3. WHEN checking the account ID, THE dfx tool SHALL return the ledger account ID for the current identity
4. WHEN creating a cycles wallet, THE dfx tool SHALL deploy a wallet canister with the specified cycles amount
5. WHEN cycles are insufficient, THE deployment SHALL fail with a descriptive error message

### Requirement 3: Canister Deployment to Testnet

**User Story:** As a developer, I want to deploy the vault canister to ICP testnet, so that it can interact with real Bitcoin and ckBTC testnets.

#### Acceptance Criteria

1. WHEN deploying to testnet, THE dfx tool SHALL use the specified network configuration
2. WHEN deployment succeeds, THE dfx tool SHALL return the canister ID
3. WHEN the canister is deployed, THE canister SHALL be accessible via the testnet URL
4. WHEN deploying with insufficient cycles, THE deployment SHALL fail with an error
5. WHEN upgrading a canister, THE dfx tool SHALL preserve the canister state

### Requirement 4: Bitcoin Testnet Wallet Setup

**User Story:** As a developer, I want to create a Bitcoin testnet wallet, so that I can receive testnet Bitcoin for testing.

#### Acceptance Criteria

1. WHEN creating a testnet wallet, THE wallet software SHALL generate testnet addresses (starting with 'tb1' or 'm'/'n')
2. WHEN receiving testnet Bitcoin, THE wallet SHALL show the transaction in the transaction history
3. WHEN querying the balance, THE wallet SHALL display the testnet Bitcoin balance
4. WHEN generating a receiving address, THE wallet SHALL provide a valid testnet address
5. WHEN the wallet is backed up, THE wallet SHALL export the seed phrase or private keys

### Requirement 5: Bitcoin Testnet UTXO Acquisition

**User Story:** As a developer, I want to obtain Bitcoin testnet UTXOs from faucets, so that I can test the vault's UTXO verification functionality.

#### Acceptance Criteria

1. WHEN requesting testnet Bitcoin from a faucet, THE faucet SHALL send Bitcoin to the provided address
2. WHEN the transaction is confirmed, THE Bitcoin SHALL appear in the wallet balance
3. WHEN viewing the transaction on a block explorer, THE transaction details SHALL be visible
4. WHEN extracting UTXO details, THE block explorer SHALL provide txid, vout, amount, and address
5. WHEN the UTXO is unspent, THE block explorer SHALL show it as available

### Requirement 6: ckBTC Testnet Token Acquisition

**User Story:** As a developer, I want to obtain ckBTC testnet tokens, so that I can test the vault's borrowing and repayment functionality.

#### Acceptance Criteria

1. WHEN requesting ckBTC from the faucet, THE faucet SHALL require Internet Identity authentication
2. WHEN ckBTC is granted, THE faucet SHALL transfer tokens to the user's principal
3. WHEN checking the balance, THE ckBTC ledger SHALL return the token balance
4. WHEN the balance is queried via dfx, THE command SHALL return the correct amount
5. WHEN ckBTC is insufficient for testing, THE user SHALL be able to request more from the faucet

### Requirement 7: Maestro API Key Configuration

**User Story:** As a developer, I want to obtain and configure a Maestro API key, so that the vault can query Ordinals inscriptions.

#### Acceptance Criteria

1. WHEN registering for Maestro, THE service SHALL provide a free tier account
2. WHEN creating an API key, THE service SHALL generate a unique key for Bitcoin testnet
3. WHEN the API key is added to the code, THE vault canister SHALL use it for HTTP outcalls
4. WHEN the API key is invalid, THE Maestro API SHALL return an authentication error
5. WHEN the API key is valid, THE Maestro API SHALL return inscription data

### Requirement 8: Vault Canister Configuration

**User Story:** As a developer, I want to configure the vault canister with testnet parameters, so that it connects to the correct networks and services.

#### Acceptance Criteria

1. WHEN configuring Bitcoin network, THE vault SHALL use BitcoinNetwork::Testnet
2. WHEN configuring ckBTC ledger, THE vault SHALL use the testnet ledger canister ID (mc6ru-gyaaa-aaaar-qaaaq-cai)
3. WHEN configuring Maestro API, THE vault SHALL use the provided API key
4. WHEN the configuration is incorrect, THE vault SHALL fail with descriptive errors
5. WHEN the configuration is correct, THE vault SHALL successfully interact with all external services

### Requirement 9: End-to-End Testing with Real Testnets

**User Story:** As a developer, I want to test the complete vault flow with real testnet resources, so that I can verify the system works correctly before mainnet deployment.

#### Acceptance Criteria

1. WHEN depositing a real testnet UTXO, THE vault SHALL verify it via ICP Bitcoin API
2. WHEN borrowing ckBTC, THE vault SHALL transfer real ckBTC tokens to the user
3. WHEN repaying a loan, THE vault SHALL verify the ckBTC transfer and unlock collateral
4. WHEN withdrawing collateral, THE vault SHALL mark the UTXO as withdrawn
5. WHEN testing with Ordinals, THE vault SHALL query Maestro API and store inscription metadata

### Requirement 10: Frontend Deployment and Testing

**User Story:** As a developer, I want to deploy the frontend to ICP, so that users can interact with the vault through a web interface.

#### Acceptance Criteria

1. WHEN building the frontend, THE build process SHALL generate static assets
2. WHEN deploying the frontend, THE dfx tool SHALL upload assets to the frontend canister
3. WHEN accessing the frontend URL, THE browser SHALL load the application
4. WHEN connecting to the vault, THE frontend SHALL use the deployed vault canister ID
5. WHEN testing frontend operations, THE UI SHALL successfully call vault canister methods

### Requirement 11: Documentation and Deployment Guide

**User Story:** As a developer, I want comprehensive documentation of the deployment process, so that others can replicate the deployment.

#### Acceptance Criteria

1. WHEN following the deployment guide, THE developer SHALL be able to deploy without errors
2. WHEN troubleshooting issues, THE documentation SHALL provide solutions for common problems
3. WHEN configuring parameters, THE documentation SHALL list all required configuration values
4. WHEN testing the deployment, THE documentation SHALL provide test scenarios and expected results
5. WHEN the deployment is complete, THE documentation SHALL include the deployed canister IDs and URLs

### Requirement 12: Monitoring and Verification

**User Story:** As a developer, I want to monitor the deployed canisters and verify they are functioning correctly, so that I can ensure system reliability.

#### Acceptance Criteria

1. WHEN checking canister status, THE dfx tool SHALL show the canister is running
2. WHEN querying canister cycles, THE dfx tool SHALL return the current cycles balance
3. WHEN calling canister methods, THE canister SHALL respond with correct data
4. WHEN viewing canister logs, THE logs SHALL show successful operations
5. WHEN an error occurs, THE logs SHALL contain descriptive error messages
