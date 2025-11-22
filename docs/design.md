# BitFold Design Document

## Executive Summary

BitFold is a decentralized lending platform that enables Bitcoin holders to leverage their Bitcoin UTXOs, including Ordinals NFTs, as collateral to borrow ckBTC on the Internet Computer.

## Core Concepts

### Collateral
- Bitcoin UTXOs (standard Bitcoin)
- Ordinals NFTs (inscribed on Bitcoin)
- Each UTXO is tracked individually

### Loans
- Borrowers can take loans denominated in ckBTC
- Loans are secured by Bitcoin collateral
- Loan-to-Value (LTV) ratio determines borrowing capacity

### Repayment
- Borrowers repay in ckBTC
- Upon full repayment, collateral is released
- Partial repayments reduce loan amount

## User Flows

1. **Deposit**: User deposits Bitcoin UTXO → Collateral is locked
2. **Borrow**: User borrows ckBTC against collateral
3. **Repay**: User repays ckBTC to reduce loan
4. **Withdraw**: User withdraws collateral after full repayment

## Technical Design

### Canister Architecture
- **Vault Canister**: Core logic for loans and collateral
- **Frontend Canister**: Serves web interface
- **Indexer Stub**: Mock indexer for testing
- **Governance Canister**: (Optional) Manages LTV ratios and policies

### Data Models
- `Loan`: Represents a loan with collateral, borrowed amount, interest
- `UTXO`: Represents a Bitcoin UTXO with address, amount, ordinal info
- `User`: User account with loans and collateral

## Security Considerations

- Collateral verification through Bitcoin API
- Ordinals verification through indexer
- ckBTC minting/transfer security
- Access control and authentication

