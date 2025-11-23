# Requirements Document - BitFold Vault Integration

## Introduction

BitFold is a decentralized Bitcoin Ordinals collateral vault system built on the Internet Computer Protocol (ICP). The system allows users to deposit Bitcoin UTXOs (including Ordinals inscriptions) as collateral and borrow ckBTC (Chain-Key Bitcoin) against them. This document specifies the requirements for integrating real Bitcoin API, ckBTC ledger, and Ordinals indexer functionality into the vault canister.

## Glossary

- **Vault Canister**: The ICP smart contract that manages collateral deposits, loans, and repayments
- **UTXO**: Unspent Transaction Output - a Bitcoin transaction output that can be used as collateral
- **Ordinal**: A Bitcoin NFT inscribed on a satoshi using the Ordinals protocol
- **ckBTC**: Chain-Key Bitcoin - a 1:1 backed Bitcoin token on ICP
- **LTV**: Loan-to-Value ratio - the percentage of collateral value that can be borrowed
- **Bitcoin Network**: The Bitcoin blockchain network (testnet for development, mainnet for production)
- **ICP Bitcoin API**: Internet Computer's native Bitcoin integration API
- **ckBTC Ledger**: The ICRC-1 compliant ledger canister for ckBTC tokens
- **Ordinals Indexer**: A service that tracks and verifies Ordinals inscriptions
- **Principal**: An ICP identity that represents a user or canister
- **Satoshi**: The smallest unit of Bitcoin (0.00000001 BTC)

## Requirements

### Requirement 1: Bitcoin UTXO Verification

**User Story:** As a user, I want to deposit a Bitcoin UTXO as collateral, so that the system verifies it exists on the Bitcoin network before accepting it.

#### Acceptance Criteria

1. WHEN a user submits a UTXO (txid, vout, amount, address), THE Vault Canister SHALL call the ICP Bitcoin API to verify the UTXO exists on the Bitcoin network
2. WHEN verifying a UTXO, THE Vault Canister SHALL confirm the UTXO is unspent on the Bitcoin network
3. WHEN verifying a UTXO, THE Vault Canister SHALL confirm the UTXO amount matches the user-provided amount
4. WHEN verifying a UTXO, THE Vault Canister SHALL confirm the UTXO address matches the user-provided address
5. WHEN a UTXO verification fails, THE Vault Canister SHALL reject the deposit and return a descriptive error message

### Requirement 2: Bitcoin UTXO Monitoring

**User Story:** As a system, I want to monitor deposited UTXOs, so that I can detect if they are spent and protect against double-spending.

#### Acceptance Criteria

1. WHEN a UTXO is deposited, THE Vault Canister SHALL periodically check if the UTXO remains unspent on the Bitcoin network
2. WHEN a deposited UTXO is detected as spent, THE Vault Canister SHALL mark it as invalid and prevent borrowing against it
3. WHEN a UTXO is locked as collateral, THE Vault Canister SHALL continue monitoring it until the loan is repaid

### Requirement 3: Ordinals Inscription Verification

**User Story:** As a user, I want to deposit an Ordinal inscription as collateral, so that the system verifies the inscription exists and retrieves its metadata.

#### Acceptance Criteria

1. WHEN a user deposits a UTXO, THE Vault Canister SHALL query an Ordinals indexer to check if an inscription exists for that UTXO
2. WHEN an inscription is found, THE Vault Canister SHALL retrieve and store the inscription metadata (inscription_id, content_type, content_preview)
3. WHEN an inscription is not found, THE Vault Canister SHALL treat the UTXO as a regular Bitcoin UTXO without Ordinal data
4. WHEN inscription verification fails due to indexer unavailability, THE Vault Canister SHALL return an error and not accept the deposit

### Requirement 4: ckBTC Minting for Loans

**User Story:** As a user, I want to borrow ckBTC against my deposited collateral, so that I receive actual ckBTC tokens in my wallet.

#### Acceptance Criteria

1. WHEN a user requests to borrow ckBTC, THE Vault Canister SHALL calculate the maximum borrowable amount based on the collateral value and LTV ratio
2. WHEN the borrow amount is valid, THE Vault Canister SHALL call the ckBTC ledger to transfer ckBTC to the user's principal
3. WHEN the ckBTC transfer succeeds, THE Vault Canister SHALL create a loan record and lock the collateral UTXO
4. WHEN the ckBTC transfer fails, THE Vault Canister SHALL reject the borrow request and return an error
5. WHEN borrowing, THE Vault Canister SHALL verify the user owns the collateral UTXO before proceeding

### Requirement 5: ckBTC Burning for Repayment

**User Story:** As a user, I want to repay my loan with ckBTC, so that the system burns the ckBTC and unlocks my collateral.

#### Acceptance Criteria

1. WHEN a user repays a loan, THE Vault Canister SHALL verify the user has transferred ckBTC to the canister's account
2. WHEN the ckBTC transfer is verified, THE Vault Canister SHALL call the ckBTC ledger to burn the received ckBTC
3. WHEN the loan is fully repaid, THE Vault Canister SHALL unlock the collateral UTXO and mark the loan as repaid
4. WHEN the loan is partially repaid, THE Vault Canister SHALL update the repaid amount and keep the collateral locked
5. WHEN ckBTC burning fails, THE Vault Canister SHALL return an error and not update the loan status

### Requirement 6: Collateral Withdrawal

**User Story:** As a user, I want to withdraw my collateral after repaying my loan, so that I can reclaim my Bitcoin UTXO.

#### Acceptance Criteria

1. WHEN a user requests to withdraw collateral, THE Vault Canister SHALL verify the UTXO has no active loans
2. WHEN a user requests to withdraw collateral, THE Vault Canister SHALL verify the user owns the UTXO
3. WHEN withdrawal conditions are met, THE Vault Canister SHALL mark the UTXO as withdrawn and remove it from active collateral
4. WHEN a UTXO has an active loan, THE Vault Canister SHALL reject the withdrawal request

### Requirement 7: Loan Interest Calculation

**User Story:** As a system, I want to calculate interest on active loans, so that borrowers pay the correct amount when repaying.

#### Acceptance Criteria

1. WHEN calculating loan value, THE Vault Canister SHALL apply the interest rate to the borrowed amount
2. WHEN a loan is created, THE Vault Canister SHALL store the interest rate and creation timestamp
3. WHEN calculating repayment amount, THE Vault Canister SHALL include accrued interest based on time elapsed
4. WHEN a user queries their loan, THE Vault Canister SHALL return the current total debt including interest

### Requirement 8: Error Handling and Validation

**User Story:** As a system, I want to validate all inputs and handle errors gracefully, so that users receive clear feedback and the system remains secure.

#### Acceptance Criteria

1. WHEN a user provides invalid input (txid, address, amount), THE Vault Canister SHALL reject the request with a descriptive error message
2. WHEN an external API call fails (Bitcoin API, ckBTC ledger, Ordinals indexer), THE Vault Canister SHALL return an error and not modify state
3. WHEN a user attempts an unauthorized action, THE Vault Canister SHALL verify the caller's principal and reject unauthorized requests
4. WHEN validating Bitcoin addresses, THE Vault Canister SHALL check the address format is valid
5. WHEN validating transaction IDs, THE Vault Canister SHALL verify the txid is 64 hexadecimal characters

### Requirement 9: Query Functions for User Data

**User Story:** As a user, I want to query my loans and collateral, so that I can view my current positions in the vault.

#### Acceptance Criteria

1. WHEN a user queries their loans, THE Vault Canister SHALL return all loans belonging to the caller's principal
2. WHEN a user queries their collateral, THE Vault Canister SHALL return all UTXOs deposited by the caller's principal
3. WHEN querying a specific loan, THE Vault Canister SHALL return the loan details if it exists
4. WHEN querying a specific UTXO, THE Vault Canister SHALL return the UTXO details if it exists
5. WHEN query functions are called, THE Vault Canister SHALL not modify any state

### Requirement 10: State Persistence

**User Story:** As a system, I want to persist all vault state, so that data is not lost during canister upgrades.

#### Acceptance Criteria

1. WHEN the canister is upgraded, THE Vault Canister SHALL preserve all loan records
2. WHEN the canister is upgraded, THE Vault Canister SHALL preserve all UTXO records
3. WHEN the canister is upgraded, THE Vault Canister SHALL preserve all user mappings
4. WHEN the canister is upgraded, THE Vault Canister SHALL preserve ID counters for loans and UTXOs


### Requirement 11: Frontend Integration with Vault Canister

**User Story:** As a user, I want to interact with the vault through a web interface, so that I can easily deposit collateral, borrow, repay, and withdraw without using command-line tools.

#### Acceptance Criteria

1. WHEN a user opens the application, THE Frontend SHALL connect to the vault canister using ICP Agent
2. WHEN a user authenticates, THE Frontend SHALL use Internet Identity to obtain the user's principal
3. WHEN a user submits a deposit form, THE Frontend SHALL call the vault canister's deposit_utxo method
4. WHEN a user requests to borrow, THE Frontend SHALL call the vault canister's borrow method
5. WHEN a user repays a loan, THE Frontend SHALL call the vault canister's repay method
6. WHEN a user withdraws collateral, THE Frontend SHALL call the vault canister's withdraw_collateral method
7. WHEN a user views their dashboard, THE Frontend SHALL query the vault canister for user loans and collateral
8. WHEN a canister call fails, THE Frontend SHALL display a user-friendly error message
9. WHEN a canister call succeeds, THE Frontend SHALL update the UI to reflect the new state
10. WHEN the user is not authenticated, THE Frontend SHALL prompt for Internet Identity login

### Requirement 12: Additional Vault Management Functions

**User Story:** As a system administrator or advanced user, I want access to additional vault management functions, so that I can monitor vault health and manage liquidations.

#### Acceptance Criteria

1. WHEN a loan's LTV exceeds the liquidation threshold, THE Vault Canister SHALL allow liquidation of the loan
2. WHEN liquidating a loan, THE Vault Canister SHALL transfer the collateral to the liquidator and mark the loan as liquidated
3. WHEN querying loan health, THE Vault Canister SHALL return the current LTV ratio and distance from liquidation
4. WHEN querying all loans, THE Vault Canister SHALL return a paginated list of all loans in the system
5. WHEN querying user statistics, THE Vault Canister SHALL return total collateral value, total borrowed amount, and average LTV for the user
6. WHEN querying vault statistics, THE Vault Canister SHALL return total value locked, total loans outstanding, and total number of users
