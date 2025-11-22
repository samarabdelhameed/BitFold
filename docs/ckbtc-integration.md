# ckBTC Integration

## Overview

BitFold uses ckBTC (Chain-Key Bitcoin) for loans. ckBTC is a tokenized version of Bitcoin on the Internet Computer.

## Operations

### Minting (Borrowing)

When a user borrows:
1. Vault calculates borrowable amount based on LTV
2. Vault calls ckBTC Ledger's `icrc1_transfer` or mint function
3. ckBTC is transferred to user's account

### Burning (Repaying)

When a user repays:
1. User transfers ckBTC to Vault canister
2. Vault calls ckBTC Ledger's burn function
3. Loan balance is reduced

## ckBTC Ledger Interface

### Transfer
```rust
pub async fn transfer_ckbtc(
    to: Principal,
    amount: u64,
) -> Result<u64, String>
```

### Mint
```rust
pub async fn mint_ckbtc(
    to: Principal,
    amount: u64,
) -> Result<u64, String>
```

## Configuration

- ckBTC Ledger Canister ID (configured in dfx.json)
- Minimum borrow amount
- Maximum borrow amount per loan

## Error Handling

- Insufficient collateral
- ckBTC ledger errors
- Network failures
- Rate limiting

